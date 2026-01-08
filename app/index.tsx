import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Menu, 
  Phone, 
  Search, 
  User, 
  Hexagon, 
  Info, 
  Briefcase, 
  BarChart, 
  Calculator, 
  Lightbulb, 
  MessageSquare, 
  Target, 
  Shield, 
  Calendar, 
  FileText, 
  Upload,
  ChevronRight,
  Mic,
  Square,
  Loader2,
  Check,
  Edit2,
  X
} from 'lucide-react';
import { GoogleGenAI, Modality, Type, FunctionDeclaration } from "@google/genai";

// Audio Utils
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): { data: string, mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// Tool Definitions
const reviewBookingDetailsTool: FunctionDeclaration = {
  name: "reviewBookingDetails",
  description: "Display a confirmation modal to the user with their booking details. Call this ONLY after collecting all 5 required pieces of information.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      firstName: { type: Type.STRING, description: "The user's first name." },
      serviceType: { type: Type.STRING, description: "The specific service requested (e.g., Personal Tax, Audit)." },
      userType: { type: Type.STRING, description: "Business Owner or Individual Taxpayer." },
      preferredDay: { type: Type.STRING, description: "Preferred timeframe (e.g., This Week, Next Week)." },
      timePreference: { type: Type.STRING, description: "Preferred time of day (e.g., Morning, Afternoon)." }
    },
    required: ["firstName", "serviceType", "userType", "preferredDay", "timePreference"]
  }
};

const Header = () => {
  return (
    <header>
      <div className="header-content">
        <div className="header-left">
          <div className="nav-item">
            <Menu size={24} />
            <span>Menu</span>
          </div>
          <a href="tel:4157711800" className="phone-link nav-item">
            <Phone size={20} />
            <span>(415) 771-1800</span>
          </a>
        </div>
        
        <div className="header-center">
          <Hexagon size={28} fill="#1a2e4a" color="#1a2e4a" />
          <div className="logo-text">Tony Quach & Co. CPA</div>
        </div>

        <div className="header-right">
          <div className="nav-item">
            <Search size={22} />
          </div>
          <div className="nav-item">
            <User size={22} />
            <span>LOGIN</span>
          </div>
        </div>
      </div>
    </header>
  );
};

const BookingModal = ({ data, onConfirm, onEdit, onCancel }) => {
  if (!data) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '500px',
        padding: '30px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: 'slideIn 0.3s ease-out'
      }}>
        <h3 style={{ 
          fontSize: '24px', 
          marginBottom: '20px', 
          color: '#1a2e4a',
          textAlign: 'center',
          borderBottom: '2px solid #f0f0f0',
          paddingBottom: '15px'
        }}>
          Confirm Your Request
        </h3>
        
        <div style={{ marginBottom: '25px', fontSize: '16px' }}>
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f5', paddingBottom: '8px' }}>
            <span style={{ fontWeight: '500', color: '#666' }}>Name:</span>
            <span style={{ fontWeight: '700', color: '#1a2e4a', textAlign: 'right' }}>{data.firstName || 'Not provided'}</span>
          </div>
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f5', paddingBottom: '8px' }}>
            <span style={{ fontWeight: '500', color: '#666' }}>Service:</span>
            <span style={{ fontWeight: '700', color: '#1a2e4a', textAlign: 'right' }}>{data.serviceType || 'Not specified'}</span>
          </div>
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f5', paddingBottom: '8px' }}>
            <span style={{ fontWeight: '500', color: '#666' }}>Type:</span>
            <span style={{ fontWeight: '700', color: '#1a2e4a', textAlign: 'right' }}>{data.userType || 'Not specified'}</span>
          </div>
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f5', paddingBottom: '8px' }}>
            <span style={{ fontWeight: '500', color: '#666' }}>Timing:</span>
            <span style={{ fontWeight: '700', color: '#1a2e4a', textAlign: 'right' }}>{data.preferredDay || 'Not specified'}</span>
          </div>
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f5', paddingBottom: '8px' }}>
            <span style={{ fontWeight: '500', color: '#666' }}>Preference:</span>
            <span style={{ fontWeight: '700', color: '#1a2e4a', textAlign: 'right' }}>{data.timePreference || 'Not specified'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
          <button 
            onClick={onConfirm}
            className="btn-cta"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Check size={20} /> Confirm Request
          </button>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={onEdit}
              style={{
                flex: 1,
                backgroundColor: 'white',
                color: '#1a2e4a',
                border: '2px solid #1a2e4a',
                padding: '12px',
                borderRadius: '4px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Edit2 size={16} /> Edit
            </button>
            <button 
              onClick={onCancel}
              style={{
                flex: 1,
                backgroundColor: '#f5f5f5',
                color: '#666',
                border: '1px solid #ddd',
                padding: '12px',
                borderRadius: '4px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <X size={16} /> Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const VoiceAssistantButton = () => {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  
  // Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputNodeRef = useRef<ScriptProcessorNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const cleanup = () => {
    if (sourcesRef.current) {
      sourcesRef.current.forEach(source => {
        try { source.stop(); } catch(e) {}
      });
      sourcesRef.current.clear();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    setIsActive(false);
    setIsLoading(false);
    nextStartTimeRef.current = 0;
  };

  const startSession = async () => {
    try {
      setIsLoading(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      inputAudioContextRef.current = inputAudioContext;
      outputAudioContextRef.current = outputAudioContext;

      const outputNode = outputAudioContext.createGain();
      outputNode.connect(outputAudioContext.destination);
      outputNodeRef.current = outputNode;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: [reviewBookingDetailsTool] }],
          systemInstruction: `You are Tony Quach & Co. CPA's AI Voice Support Assistant.

          CORE RULES:
          1. Use the "reviewBookingDetails" tool IMMEDIATELY upon collecting all 5 pieces of lead information. This is MANDATORY.
          2. Do not invent information. Use provided business details.
          3. Keep responses concise and professional.

          BUSINESS INFO:
          - Name: Tony Quach & Co. CPA
          - Phone: (415) 771-1800 x3
          - Services: Personal/Business Tax, Audit Rep, Incorporation, IRS Resolution.
          - Philosophy: "You don't have to be a tax expert. That's our job."

          LEAD QUALIFICATION SCRIPT (Execute strictly):
          When a user wants to schedule or get help, ask these 5 questions one by one:
          1. "First name?"
          2. "Service type needed?" (e.g. Personal tax, Business tax, IRS problem, Audit, Incorporation)
          3. "Business owner or individual?"
          4. "Consultation this week or next?"
          5. "Morning or afternoon preference?"

          CRITICAL INSTRUCTION:
          Once you have answers for ALL 5 questions, you MUST:
          1. Call the "reviewBookingDetails" function with the collected data.
          2. THEN, say: "Please review your details on the screen. If everything looks correct, click Confirm to submit your request."

          Do not summarize verbally if you are calling the tool. Let the tool show the summary.`,
        },
        callbacks: {
          onopen: () => {
            setIsLoading(false);
            setIsActive(true);
            
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            inputNodeRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                 session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message) => {
            // Check for tool calls
            if (message.toolCall) {
              const toolCalls = message.toolCall.functionCalls;
              if (toolCalls && toolCalls.length > 0) {
                const call = toolCalls.find(fc => fc.name === 'reviewBookingDetails');
                if (call) {
                   console.log("Tool call received:", call.args);
                   setModalData(call.args);
                   
                   sessionPromise.then(session => {
                     session.sendToolResponse({
                       functionResponses: toolCalls.map(fc => ({
                         response: { result: 'Modal successfully displayed to user.' },
                         id: fc.id
                       }))
                     });
                   });
                }
              }
            }

            // Handle Audio
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const ctx = outputAudioContextRef.current;
              if (ctx) {
                try {
                  const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                  const source = ctx.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(outputNodeRef.current!);
                  source.addEventListener('ended', () => sourcesRef.current.delete(source));
                  source.start(nextStartTimeRef.current);
                  sourcesRef.current.add(source);
                  nextStartTimeRef.current += audioBuffer.duration;
                } catch (e) {
                  console.error("Audio decoding error", e);
                }
              }
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(src => {
                try { src.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: cleanup,
          onerror: (e) => {
            console.error("Session error", e);
            cleanup();
          }
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (error) {
      console.error("Failed to start session", error);
      setIsLoading(false);
    }
  };

  const toggleSession = () => {
    if (isActive || isLoading) cleanup();
    else startSession();
  };

  const handleConfirm = () => {
    setModalData(null);
    alert("Request Submitted! We will contact you shortly.");
    cleanup();
  };

  const handleEdit = () => {
    setModalData(null);
    alert("Please tell the assistant what you would like to change.");
  };

  const handleCancel = () => {
    setModalData(null);
    cleanup();
  };

  useEffect(() => cleanup, []);

  return (
    <>
      <button 
        className="btn-cta" 
        onClick={toggleSession}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px', justifyContent: 'center' }}
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={20} />
        ) : isActive ? (
          <Square size={20} fill="white" />
        ) : (
          <Mic size={20} />
        )}
        {isLoading ? "Connecting..." : isActive ? "Stop Voice Chat" : "AI Voice Support"}
      </button>

      <BookingModal 
        data={modalData}
        onConfirm={handleConfirm}
        onEdit={handleEdit}
        onCancel={handleCancel}
      />
    </>
  );
};

const Hero = () => {
  return (
    <div className="hero">
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <div className="hero-sub">You don't have to be a tax expert.</div>
        <div className="hero-main">That's our job.</div>
        <VoiceAssistantButton />
      </div>
    </div>
  );
};

const QuickNav = () => {
  const items = [
    { icon: Info, label: "About" },
    { icon: Briefcase, label: "Our Services" },
    { icon: BarChart, label: "Financial Guides" },
    { icon: Calculator, label: "Tax Center" },
    { icon: Lightbulb, label: "Resources" },
    { icon: MessageSquare, label: "Contact" },
  ];

  return (
    <section className="quick-nav">
      <div className="nav-grid">
        {items.map((item, index) => (
          <div className="nav-cell" key={index}>
            <item.icon />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

const ServiceCard = ({ icon: Icon, title, description }) => (
  <div className="service-card">
    <div className="service-icon">
      <Icon size={32} />
    </div>
    <div className="service-content">
      <h3>{title}</h3>
      <p>{description}</p>
      <a href="#" className="link-green">
        Learn more <ChevronRight size={16} />
      </a>
    </div>
  </div>
);

const ServicesShowcase = () => {
  return (
    <section className="services-section">
      <div className="service-list">
        <ServiceCard 
          icon={Target}
          title="Professional Services"
          description="You get one-on-one guidance that helps manage risk and improve performance."
        />
        <ServiceCard 
          icon={Shield}
          title="Audit Representation"
          description="We take care of your business for you, so you can get back to the job of running your business."
        />
        <ServiceCard 
          icon={Calendar}
          title="Tax Services"
          description="We pride ourselves on being very effective, efficient, and discreet."
        />
        <ServiceCard 
          icon={FileText}
          title="Incorporation Services"
          description="We help with the incorporation and setup of C-Corporations, S-Corporations, and Limited Liability Companies."
        />
      </div>
    </section>
  );
};

const MainContent = () => {
  return (
    <section className="main-content">
      <div className="container">
        <div className="content-block">
          <h2 style={{ fontSize: '32px' }}>Our Focus is Tax.</h2>
          <p>
            Tony Quach & Co. CPA is a tax accounting firm that specializes in helping businesses and individuals save on their tax less legally.
          </p>
          <a href="#" className="link-green">About Us <ChevronRight size={16} /></a>
        </div>

        <div className="content-block">
          <h2 style={{ fontSize: '26px' }}>Today's tax laws are complicated.</h2>
          <p>
            Filing a relatively simple return can be confusing. It is just too easy to overlook deductions and credits to which you are entitled. And let's face it, computer software is still no substitute for the assistance of an experienced tax professional.
          </p>
          <a href="#" className="link-green">Our Services <ChevronRight size={16} /></a>
        </div>

        <div className="content-block">
          <h2 style={{ fontSize: '22px' }}>Call us at (415) 771-1800 x3.</h2>
          <p>
            We can also assist if you find yourself on the wrong side of the IRS. We're here to help you resolve your tax problems and put an end to the misery that the IRS can put you through.
          </p>
          <a href="#" className="link-green">Get in Touch <ChevronRight size={16} /></a>
        </div>
      </div>
    </section>
  );
};

const SecondaryCTA = () => {
  return (
    <section className="secondary-cta">
      <div className="cta-grid">
        <div className="cta-card">
          <div className="cta-icon-box">
            <Calendar size={28} />
          </div>
          <h3>We Are Here to Help</h3>
          <p style={{ marginBottom: '15px', color: '#666' }}>We offer a free consultation to determine how we can best serve you.</p>
          <a href="#" className="link-green">Contact Us <ChevronRight size={16} /></a>
        </div>
        
        <div className="cta-card">
          <div className="cta-icon-box">
            <Upload size={28} />
          </div>
          <h3>Send Us a File</h3>
          <p style={{ marginBottom: '15px', color: '#666' }}>Use our convenient SecureSend page to securely deliver a file directly to a member of our firm.</p>
          <a href="#" className="link-green">Secure Send <ChevronRight size={16} /></a>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer>
      <div className="container">
        <div>&copy; Tony Quach & Co. CPA 2025</div>
        <div className="footer-links">
          <a href="#">Site Map</a> &bull;
          <a href="#">Privacy Policy</a> &bull;
          <a href="#">Disclaimer</a>
        </div>
      </div>
    </footer>
  );
};

const App = () => {
  return (
    <>
      <Header />
      <Hero />
      <QuickNav />
      <ServicesShowcase />
      <MainContent />
      <SecondaryCTA />
      <Footer />
    </>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);