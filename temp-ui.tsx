import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Sparkles, Users } from 'lucide-react';

const GuestBook = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showWithPhoto, setShowWithPhoto] = useState(true);
  
  const messages = [
    {
      id: 1,
      name: "Ferian Richards",
      location: "Rose Hall Center",
      date: "11/4/2025",
      message: "Thank you for everything! This journey has been incredible and I'm so grateful for all the memories we've shared.",
      drawing: null,
      isDrawing: false
    }
  ];

  const nextMessage = () => {
    setCurrentIndex((prev) => (prev + 1) % messages.length);
  };

  const prevMessage = () => {
    setCurrentIndex((prev) => (prev - 1 + messages.length) % messages.length);
  };

  const currentMessage = messages[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="text-violet-600" size={32} />
              <h1 className="text-4xl font-light text-gray-900">Graduation Reflections</h1>
            </div>
            <p className="text-gray-500 ml-11">Class of 2025 memories and messages</p>
          </div>
          
          <div className="flex gap-6 items-center">
            <div className="flex items-center gap-2 text-gray-600">
              <Users size={18} />
              <span className="font-medium">1 signature</span>
            </div>
            <button className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              + New Message
            </button>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <div className="max-w-6xl mx-auto mb-6 flex justify-center">
        <div className="inline-flex bg-white rounded-lg shadow-sm p-1">
          <button
            onClick={() => setShowWithPhoto(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              showWithPhoto ? 'bg-violet-100 text-violet-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            With Photo
          </button>
          <button
            onClick={() => setShowWithPhoto(false)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              !showWithPhoto ? 'bg-violet-100 text-violet-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Without Photo
          </button>
        </div>
      </div>

      {/* Single Card with Two Variants */}
      <div className="max-w-6xl mx-auto relative">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-12">
            
            {showWithPhoto ? (
              <>
                {/* With Photo Variant - Image on Left */}
                <div className="col-span-5 bg-gradient-to-br from-violet-400 via-purple-400 to-pink-400 p-12 flex flex-col justify-center items-center">
                  <div className="w-48 h-48 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl mb-6">
                    <span className="text-7xl font-bold text-white">
                      {currentMessage.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-white mb-3">
                      {currentMessage.name}
                    </h2>
                    <div className="inline-flex items-center gap-2 text-white/90 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                      <MapPin size={18} />
                      <span className="text-base">{currentMessage.location}</span>
                    </div>
                  </div>
                </div>

                <div className="col-span-7 p-12">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-1 h-8 bg-gradient-to-b from-violet-600 to-purple-600 rounded-full"></div>
                    <h3 className="text-xl font-medium text-gray-700">Their Message</h3>
                  </div>

                  {currentMessage.isDrawing ? (
                    <div className="border-2 border-gray-200 rounded-2xl bg-gray-50 p-6 min-h-[400px] flex items-center justify-center">
                      <img 
                        src={currentMessage.drawing} 
                        alt="Student drawing"
                        className="max-w-full max-h-[500px] object-contain"
                      />
                    </div>
                  ) : (
                    <blockquote className="border-l-4 border-violet-300 pl-6 py-2 text-gray-700 text-2xl leading-relaxed italic font-light">
                      {currentMessage.message}
                    </blockquote>
                  )}

                  <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-gray-500">{currentMessage.date}</span>
                    <span className="text-sm text-gray-500">{currentIndex + 1} / {messages.length}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Without Photo Variant - Text Only */}
                <div className="col-span-4 bg-gradient-to-br from-slate-50 to-gray-100 p-10 flex flex-col justify-center border-r border-gray-200">
                  <div className="inline-block px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium mb-4 w-fit">
                    Graduate
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    {currentMessage.name}
                  </h2>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={18} />
                    <span className="text-base">{currentMessage.location}</span>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-gray-300">
                    <span className="text-sm text-gray-500">{currentMessage.date}</span>
                  </div>
                </div>

                <div className="col-span-8 p-12">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-1 h-8 bg-gradient-to-b from-violet-600 to-purple-600 rounded-full"></div>
                    <h3 className="text-xl font-medium text-gray-700">Their Message</h3>
                  </div>

                  {currentMessage.isDrawing ? (
                    <div className="border-2 border-gray-200 rounded-2xl bg-gray-50 p-6 min-h-[400px] flex items-center justify-center">
                      <img 
                        src={currentMessage.drawing} 
                        alt="Student drawing"
                        className="max-w-full max-h-[500px] object-contain"
                      />
                    </div>
                  ) : (
                    <blockquote className="border-l-4 border-violet-300 pl-6 py-2 text-gray-700 text-2xl leading-relaxed italic font-light">
                      {currentMessage.message}
                    </blockquote>
                  )}

                  <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center">
                    <span className="text-sm text-gray-500">{currentIndex + 1} / {messages.length}</span>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={prevMessage}
          disabled={messages.length <= 1}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 w-12 h-12 rounded-full bg-white shadow-lg hover:shadow-xl border-2 border-gray-200 hover:border-violet-600 hover:text-violet-600 flex items-center justify-center transition-all disabled:opacity-30"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={nextMessage}
          disabled={messages.length <= 1}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 w-12 h-12 rounded-full bg-white shadow-lg hover:shadow-xl border-2 border-gray-200 hover:border-violet-600 hover:text-violet-600 flex items-center justify-center transition-all disabled:opacity-30"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};

export default GuestBook;