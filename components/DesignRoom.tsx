
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { RoomInfo, Message, ImageFile, User, Critique, Checkpoint, ProductionSheet, Turntable } from '../types';
import ChatPanel from './ChatPanel';
import ImagePanel from './ImagePanel';
import HistoryPanel from './HistoryPanel';
import MoodboardPanel from './MoodboardPanel';
import CritiquePanel from './CritiquePanel';
import { editImageWithPrompt, summarizeMoodboard, getCritiqueForImage, getProductionSheet, generateTurntableViews } from '../services/geminiService';
import ChatIcon from './icons/ChatIcon';
import MoodboardIcon from './icons/MoodboardIcon';
import ChevronIcon from './icons/ChevronIcon';
import ProductionSheetModal from './ProductionSheetModal';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface DesignRoomProps {
  roomInfo: RoomInfo;
  onLeave: () => void;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });


const DesignRoom: React.FC<DesignRoomProps> = ({ roomInfo, onLeave }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [baseImage, setBaseImage] = useState<ImageFile | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for multi-user simulation
  const [usersInRoom, setUsersInRoom] = useState<User[]>([roomInfo.user]);
  const [activeUser, setActiveUser] = useState<User>(roomInfo.user);

  // States for moodboard
  const [moodboardImages, setMoodboardImages] = useState<ImageFile[]>([]);
  const [moodboardVibe, setMoodboardVibe] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'moodboard'>('chat');

  // State for sketch-to-fabric feature
  const [activeSketch, setActiveSketch] = useState<ImageFile | null>(null);

  // State for AI Critique feature
  const [critiques, setCritiques] = useState<Record<number, Critique | null>>({});
  const [activeCritique, setActiveCritique] = useState<Critique | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>('checkpoints');

  // State for Finalize feature
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [productionSheet, setProductionSheet] = useState<ProductionSheet | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [turntable, setTurntable] = useState<Turntable | null>(null);
  const [isGeneratingTurntable, setIsGeneratingTurntable] = useState(false);

  const debounceTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const systemMessage: Message = {
      id: Date.now(),
      user: { name: 'System' },
      text: `${roomInfo.user.name} has joined the design room.`,
    };
    setMessages([systemMessage]);
  }, [roomInfo.user.name]);
  
  const processNewImage = async (newImage: string) => {
    const newCheckpoint: Checkpoint = {
        id: Date.now(),
        image: newImage,
        votes: {},
    };
    setCurrentImage(newImage);
    setCheckpoints(prev => [...prev, newCheckpoint]);

    try {
        const newImageFile: ImageFile = {
            data: newImage.split(',')[1],
            mimeType: newImage.match(/data:(.*);/)?.[1] || 'image/png'
        };
        const critique = await getCritiqueForImage(newImageFile);
        setCritiques(prev => ({ ...prev, [newCheckpoint.id]: critique }));
        setActiveCritique(critique);

        const consultantMessage: Message = {
            id: Date.now(),
            user: { name: 'AI Consultant' },
            text: critique.oneLiner,
        };
        setMessages(prev => [...prev, consultantMessage]);
    } catch (critiqueError) {
        console.error("Failed to get AI critique:", critiqueError);
        setError(critiqueError instanceof Error ? critiqueError.message : "Failed to generate AI critique.");
        setCritiques(prev => ({ ...prev, [newCheckpoint.id]: null }));
        setActiveCritique(null);
    }
  };
  
  const generateOutfit = useCallback(async (isMoodboardSync = false) => {
    if (!baseImage) return;

    const userMessages = messages.filter(m => m.user.name !== 'System' && m.user.name !== 'AI Consultant');
    if (userMessages.length === 0 && !isMoodboardSync) return;

    setIsLoading(true);
    setError(null);

    const conversation = userMessages
        .slice(-5)
        .map(m => `${m.user.name}: ${m.text}`)
        .join('\n');
    
    let prompt: string;
    let imagesForPrompt: ImageFile[];

    if (activeSketch) {
      prompt = `CRITICAL TASK: You are an AI fashion designer. A sketch of a new garment has been provided. Your instructions are to:
1.  **Identify ALL clothing** on the person in the main photograph.
2.  **Completely REMOVE** all of that clothing.
3.  **Generate a NEW, photorealistic outfit** directly on the person, using the provided sketch as the primary design reference.
The original clothing must be entirely gone. Maintain the original person, pose, and background.`;
      imagesForPrompt = [baseImage, activeSketch];
    } else {
       prompt = `CRITICAL TASK: Your goal is to be a virtual stylist. You must completely REMOVE all existing clothing from the person in the image and REPLACE it with a new outfit based on the instructions.

**DO NOT layer new clothes on top of old ones.** The original outfit must be fully erased.

The new outfit should be based on the following context. Do not change the person, their pose, or the background. Generate only the photorealistic final image.`;
      imagesForPrompt = [baseImage];
    }
    
    if (moodboardVibe) {
        prompt += `\n\nOverall Vibe from Moodboard:\n${moodboardVibe}`;
    }

    if (conversation.trim()) {
      prompt += `\n\nRecent Conversation:\n${conversation}`;
    }

    if (!moodboardVibe && !conversation.trim()) {
      setIsLoading(false);
      return;
    }

    try {
        const newImage = await editImageWithPrompt(imagesForPrompt, prompt);
        await processNewImage(newImage);
        
        const systemMessageText = isMoodboardSync 
            ? 'AI generated a new design synchronized with the moodboard.'
            : 'AI generated a new design based on the conversation.';

        const systemMessage: Message = {
          id: Date.now(),
          user: { name: 'System' },
          text: systemMessageText,
        };
        setMessages(prev => [...prev, systemMessage]);

    } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
        setIsLoading(false);
    }
  }, [baseImage, messages, moodboardVibe, activeSketch]);


  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now(),
      user: activeUser,
      text,
    };
    setMessages(prev => [...prev, newMessage]);

    if(baseImage){
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        
        debounceTimeoutRef.current = window.setTimeout(() => {
            generateOutfit(false);
        }, 5000);
    }
  };
  
   useEffect(() => {
    return () => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
    };
  }, []);

  const handleImageUpload = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fileToBase64(file);
      const mimeType = file.type;
      const imageFile = { data, mimeType };
      const imageUrl = `data:${mimeType};base64,${data}`;
      
      setBaseImage(imageFile);
      setCheckpoints([]); // Reset checkpoints for new image
      setCritiques({});
      
      await processNewImage(imageUrl); // Process the initial image to get a critique

      setActiveSketch(null);
      const systemMessage: Message = {
        id: Date.now(),
        user: { name: 'System' },
        text: `${roomInfo.user.name} uploaded the base model image. The design session has started!`,
      };
      setMessages(prev => [...prev, systemMessage]);

    } catch (err) {
      setError("Failed to upload image or get initial critique.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCheckpoint = (checkpoint: Checkpoint) => {
    setCurrentImage(checkpoint.image);
    setActiveCritique(critiques[checkpoint.id] ?? null);
  };

  const handleReaction = (checkpointId: number, emoji: string) => {
    setCheckpoints(prevCheckpoints =>
      prevCheckpoints.map(c => {
        if (c.id !== checkpointId) {
          return c;
        }

        const newVotes = { ...c.votes };
        const currentUserVote = newVotes[activeUser.name];

        if (currentUserVote === emoji) {
          // User clicked the same emoji again, so un-vote.
          delete newVotes[activeUser.name];
        } else {
          // User clicked a new emoji (or voted for the first time).
          newVotes[activeUser.name] = emoji;
        }

        return { ...c, votes: newVotes };
      })
    );
  };
  
  const handleAddUser = (name: string) => {
    if (usersInRoom.some(u => u.name.toLowerCase() === name.toLowerCase())) {
        return;
    }
    const newUser: User = { name };
    setUsersInRoom(prev => [...prev, newUser]);
    
    const systemMessage: Message = {
        id: Date.now(),
        user: { name: 'System' },
        text: `${name} has joined the design room.`,
    };
    setMessages(prev => [...prev, systemMessage]);
    setActiveUser(newUser);
  };
  
  const handleSwitchUser = (user: User) => {
    setActiveUser(user);
  };
  
  const handleAddToMoodboard = async (file: File) => {
      try {
        const data = await fileToBase64(file);
        const mimeType = file.type;
        const newImageFile = { data, mimeType };
        setMoodboardImages(prev => [...prev, newImageFile]);
      } catch (err) {
          setError("Failed to add image to moodboard.");
      }
  };

  const handleSketchUpload = async (file: File) => {
      if (!baseImage) {
          setError("Please upload a base model image before adding a sketch.");
          return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const data = await fileToBase64(file);
        const mimeType = file.type;
        const sketchFile = { data, mimeType };
        setActiveSketch(sketchFile);
        
        const sketchPrompt = `CRITICAL TASK: You are an AI fashion designer. A sketch of a new garment has been provided. Your instructions are to:
1.  **Identify ALL clothing** on the person in the main photograph.
2.  **Completely REMOVE** all of that clothing.
3.  **Generate a NEW, photorealistic outfit** directly on the person, using the provided sketch as the primary design reference.
The original clothing must be entirely gone. Maintain the original person, pose, and background.`;

        const newImage = await editImageWithPrompt([baseImage, sketchFile], sketchPrompt);
        await processNewImage(newImage);
        
        const systemMessage: Message = {
          id: Date.now(),
          user: { name: 'System' },
          text: `${activeUser.name} generated a new outfit from a sketch.`,
        };
        setMessages(prev => [...prev, systemMessage]);

      } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to apply sketch.");
          setActiveSketch(null);
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
    if (moodboardImages.length > 0) {
        const summarize = async () => {
            setIsSummarizing(true);
            try {
                const summary = await summarizeMoodboard(moodboardImages);
                setMoodboardVibe(summary);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to summarize moodboard.");
            } finally {
                setIsSummarizing(false);
            }
        };
        summarize();
    } else {
        setMoodboardVibe(null);
    }
  }, [moodboardImages]);

  const handleSyncWithMoodboard = () => {
      if (moodboardVibe) {
          generateOutfit(true);
      }
  };

  const handleFinalizeDesign = async () => {
    if (!currentImage) {
        setError("There is no active design to finalize.");
        return;
    }
    setIsFinalizing(true);
    setError(null);
    try {
        const currentImageFile: ImageFile = {
            data: currentImage.split(',')[1],
            mimeType: currentImage.match(/data:(.*);/)?.[1] || 'image/png'
        };
        const sheet = await getProductionSheet(currentImageFile);
        setProductionSheet(sheet);
        setIsModalOpen(true);
    } catch (err) {
        setError(err instanceof Error ? err.message : "Could not generate production sheet.");
    } finally {
        setIsFinalizing(false);
    }
  };
  
  const handleGenerateTurntable = async () => {
    if (!currentImage) return;
    setIsGeneratingTurntable(true);
    setError(null);
    try {
      const currentImageFile: ImageFile = {
        data: currentImage.split(',')[1],
        mimeType: currentImage.match(/data:(.*);/)?.[1] || 'image/png'
      };
      const views = await generateTurntableViews(currentImageFile);
      setTurntable({
        front: currentImage,
        ...views,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate turntable views.");
    } finally {
      setIsGeneratingTurntable(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTurntable(null); // Reset on close
  };

  const toggleAccordion = (section: string) => {
    setOpenAccordion(prev => (prev === section ? null : section));
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
        {isModalOpen && productionSheet && (
            <ProductionSheetModal
                sheet={productionSheet}
                image={currentImage!}
                onClose={handleCloseModal}
                onGenerateTurntable={handleGenerateTurntable}
                turntable={turntable}
                isGeneratingTurntable={isGeneratingTurntable}
            />
        )}
        <header className="flex items-center justify-between p-4 bg-[#FFFBF8] border-b border-[#FBE6DA] shadow-sm flex-shrink-0">
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#F99B1C] to-[#FFC87E]">
                Studio: <span className="text-[#6D574E]">{roomInfo.roomName}</span>
            </h1>
            <div className="flex items-center gap-4">
                <button
                    onClick={handleFinalizeDesign}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white bg-[#F99B1C] hover:bg-[#e08a10] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#FFFBF8] focus:ring-[#F99B1C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!currentImage || isFinalizing}
                >
                    <CheckCircleIcon />
                    {isFinalizing ? 'Finalizing...' : 'Finalize Design'}
                </button>
                <button
                onClick={onLeave}
                className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#FFFBF8] focus:ring-red-500 transition-colors"
                >
                Leave Room
                </button>
            </div>
        </header>

        <main className="flex flex-grow overflow-hidden">
            <div className="flex-1 lg:flex-[2] xl:flex-[3] flex flex-col p-4 bg-[#FBE6DA]">
                <div className="flex-grow min-h-0">
                    <ImagePanel
                        currentImage={currentImage}
                        isLoading={isLoading}
                        onImageUpload={handleImageUpload}
                        error={error}
                    />
                </div>
                
                <div className="flex-shrink-0 mt-4 space-y-2 overflow-y-auto max-h-[40vh]">
                    {/* AI Critique Accordion */}
                    {checkpoints.length > 0 && (
                        <div className="bg-[#FFFBF8] rounded-lg shadow-sm">
                             <button
                                onClick={() => toggleAccordion('critique')}
                                className="w-full flex justify-between items-center p-3 font-semibold text-[#C89F8D] hover:text-[#6D574E]"
                            >
                                <span className="text-sm uppercase tracking-wider">AI Critique</span>
                                <ChevronIcon isOpen={openAccordion === 'critique'} />
                            </button>
                            {openAccordion === 'critique' && (
                                <div className="p-4 border-t border-[#FBE6DA]">
                                    <CritiquePanel critique={activeCritique} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Checkpoints Accordion */}
                    {checkpoints.length > 1 && (
                         <div className="bg-[#FFFBF8] rounded-lg shadow-sm">
                             <button
                                onClick={() => toggleAccordion('checkpoints')}
                                className="w-full flex justify-between items-center p-3 font-semibold text-[#C89F8D] hover:text-[#6D574E]"
                            >
                                <span className="text-sm uppercase tracking-wider">Checkpoints & Voting</span>
                                <ChevronIcon isOpen={openAccordion === 'checkpoints'} />
                            </button>
                            {openAccordion === 'checkpoints' && (
                                <div className="p-4 border-t border-[#FBE6DA]">
                                    <HistoryPanel 
                                        checkpoints={checkpoints}
                                        activeUser={activeUser}
                                        onSelectCheckpoint={handleSelectCheckpoint}
                                        onReaction={handleReaction}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 xl:flex-[2] flex flex-col bg-[#FDEFE1] border-l border-[#FFC87E]/50 h-full">
                <div className="flex-shrink-0 border-b border-[#FFC87E]/50">
                    <nav className="flex space-x-2 p-2" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                activeTab === 'chat'
                                ? 'bg-[#F99B1C] text-white'
                                : 'text-[#C89F8D] hover:bg-[#FBE6DA] hover:text-[#6D574E]'
                            }`}
                        >
                           <ChatIcon />
                           <span>Chat</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('moodboard')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                activeTab === 'moodboard'
                                ? 'bg-[#F99B1C] text-white'
                                : 'text-[#C89F8D] hover:bg-[#FBE6DA] hover:text-[#6D574E]'
                            }`}
                        >
                           <MoodboardIcon />
                           <span>Moodboard</span>
                        </button>
                    </nav>
                </div>

                <div className="flex-grow overflow-hidden">
                    {activeTab === 'chat' && (
                        <ChatPanel
                          messages={messages}
                          activeUser={activeUser}
                          onSendMessage={handleSendMessage}
                          users={usersInRoom}
                          onAddUser={handleAddUser}
                          onSwitchUser={handleSwitchUser}
                          onSketchUpload={handleSketchUpload}
                          isImageLoaded={!!baseImage}
                        />
                    )}
                    {activeTab === 'moodboard' && (
                        <MoodboardPanel 
                            images={moodboardImages}
                            vibe={moodboardVibe}
                            onAddImage={handleAddToMoodboard}
                            onSync={handleSyncWithMoodboard}
                            isSummarizing={isSummarizing}
                            isGenerating={isLoading}
                        />
                    )}
                </div>
            </div>
        </main>
    </div>
  );
};

export default DesignRoom;