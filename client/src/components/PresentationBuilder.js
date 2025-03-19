import React from "react";

function PresentationBuilder() {
  return (
    <div className="flex flex-col h-screen bg-[#1a1a1a] text-white p-4">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="bg-[#323232] p-6 rounded-lg border border-blue-500 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-semibold mb-4">PRESENTATION BUILDER</h2>
          <p className="text-center text-gray-300">
            Create stunning presentations with AI assistance.
          </p>
          <span className="mt-4 text-yellow-300 text-lg font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
            Coming Soon
          </span>
        </div>
      </div>
    </div>
  );
}

export default PresentationBuilder;