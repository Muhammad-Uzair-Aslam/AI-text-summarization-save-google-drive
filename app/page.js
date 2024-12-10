
"use client";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import db from "@/config/firebase";

const Home = () => {
  const [inputText, setInputText] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const query = async (data) => {
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
        {
          headers: {
            Authorization: "Bearer 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",
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        return { error: errorData.error || "Unknown error occurred." };
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API request error:", error);
      return { error: error.message || "An error occurred." };
    }
  };

  const handleSummarize = async () => {
    if (!inputText.trim()) {
      toast.error("Please enter some text to summarize.", { position: "top-center" });
      return;
    }

    setLoading(true);
    setSummary("");

    const response = await query({ inputs: inputText });

    if (response.error) {
      toast.error(`Error: ${response.error}`, { position: "top-center" });
    } else {
      const summarizedText = response[0]?.summary_text || "Failed to summarize text.";
      setSummary(summarizedText);

      try {
        await addDoc(collection(db, "AI_summarize_text"), { summary_text: summarizedText });
        toast.success("Summary saved to Firestore!", { position: "top-center" });

        const res = await fetch("/api/saveToCloud", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ summary: summarizedText }),
        });

        const data = await res.json();

        if (res.ok) {
          toast.success(`File saved on Google Drive! File ID: ${data.fileId}`, {
            position: "top-center",
          });
        } else {
          toast.error(`Google Drive Error: ${data.error}`, { position: "top-center" });
        }
      } catch (googleDriveError) {
        console.error("Failed to save on Google Drive:", googleDriveError.message);
        toast.error("Failed to save on Google Drive.", { position: "top-center" });
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 to-black flex items-center justify-center text-gray-300">
      <main className="bg-gray-800 rounded-xl shadow-xl w-full max-w-6xl p-12 mt-8">
        
        {/* Header */}
        <h1 className="text-5xl py-2 text-white font-bold mb-6 text-center text-gradient bg-gradient-to-r from-green-500 to-blue-400 rounded-lg">
          Text Summarizer
        </h1>

        <div className="flex flex-col md:flex-row gap-8 mt-4">
  
  {/* Input Card */}
  <div className="bg-gray-700 rounded-lg shadow-lg transform hover:scale-105 transition-all p-6 w-full md:w-2/3">
    <h2 className="text-3xl font-bold mb-4">Input Text</h2>
    <textarea
      className="w-full h-96 bg-gray-900 p-4 rounded-lg text-gray-300 focus:ring-2 focus:ring-purple-500"
      placeholder="Enter text to summarize..."
      value={inputText}
      onChange={(e) => setInputText(e.target.value)}
    ></textarea>
  </div>

  {/* Summary Card */}
  <div className="bg-gray-700 rounded-lg shadow-lg transform hover:scale-105 transition-all p-6 w-full md:w-1/3">
    <h2 className="text-3xl font-bold mb-4">Summary</h2>
    <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-auto text-gray-200">
      {summary || "The summary will be generated here..."}
    </div>
  </div>

</div>


        {/* Summarize Button */}
        <div className="mt-8 text-center">
          <button
            className="bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:scale-105 transition-transform"
            onClick={handleSummarize}
            disabled={loading}
          >
            {loading ? "Summarizing..." : "Summarize"}
          </button>
        </div>

      </main>

      <ToastContainer />
    </div>
  );
};

export default Home;
