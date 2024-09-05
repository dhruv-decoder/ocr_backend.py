"use client";

import { useState, useEffect, ChangeEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";
import useProfile from "../hook/useProfile";

export default function VerificationDocuments() {
  const supabase = createClient();
  const router = useRouter();
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useProfile();
  const [userType, setUserType] = useState<"student" | "alumni">("student");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<"idcard" | "degree" | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const userId = profile?.id;

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadType(null);
    setUploadError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadType || !userId) {
      setUploadError("Please select a file and ensure your profile is loaded.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('https://ocrbackendpy-production.up.railway.app/process-ocr'
, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.is_verified) {
        // Store the extracted data in Supabase
        const { error } = await supabase
          .from('user_verifications')
          .upsert({
            user_id: userId,
            name: data.extracted_data.name,
            college: data.extracted_data.college,
            year: data.extracted_data.year,
            document_type: uploadType,
            is_verified: true
          });

        if (error) {
          throw new Error("Failed to store verification data");
        }

        router.push("/profile");
      } else {
        setUploadError("Document not verified");
      }
    } catch (error) {
      setUploadError(`Error processing document: ${error.message}`);
      console.error(`Error processing document:`, error);
    }

    setUploading(false);
  };

  return (
    <div className="w-full relative min-h-screen bg-white dark:bg-neutral-950 flex flex-col items-center justify-center py-12 px-6">
      <div className="w-full space-y-6 text-center">
        <h1 className="text-3xl font-bold text-black dark:text-white">
          Upload proof of your academic status
        </h1>
        <p className="text-black dark:text-white">
          We need a little more proof to verify your academic status. What we need to see:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-neutral-950 p-6 border border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center">
            <Image
              src="/image/id.png"
              alt="Sample Student ID"
              width={400}
              height={240}
              className="mb-4"
            />
            <h2 className="text-lg font-semibold text-black dark:text-white">
              {userType === "student" ? "Your student ID" : "Your Alumni ID"}
            </h2>
            <p className="text-black dark:text-white text-center">
              Your ID should include a date that verifies your current enrollment. Make sure the image is clear and easy to read; if it looks blurry, please take a new photo and upload it again.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                handleFileUpload(e);
                setUploadType("idcard");
              }}
              className="mt-2 py-1 px-2 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-semibold cursor-pointer transition-all"
            />
          </div>

          {/* Degree Section */}
          <div className="bg-white dark:bg-neutral-950 p-6 border border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center">
            <Image
              src="/image/degree.png"
              alt="Sample Degree"
              width={400}
              height={240}
              className="mb-4"
            />
            <h2 className="text-lg font-semibold text-black dark:text-white">
              Or another form of proof
            </h2>
            <p className="text-black dark:text-white text-center">
              If you don't have a student ID, or it doesn't include a date, you can upload a letter on school letterhead or any documentation with a date that demonstrates your current enrollment.
            </p>
            <input
              type="file"
              accept="application/pdf, image/*"
              onChange={(e) => {
                handleFileUpload(e);
                setUploadType("degree");
              }}
              className="mt-2 py-1 px-2 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-semibold cursor-pointer transition-all"
            />
          </div>
        </div>

        <div className="border-t border-dotted border-gray-300 dark:border-gray-700 my-6"></div>

        <div className="bg-white dark:bg-neutral-950 p-6 border border-gray-300 dark:border-gray-700 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold text-black dark:text-white">
            Please upload proof of your academic status.
          </h3>

          <div className="w-64 h-64 border border-dotted border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden shadow-lg mx-auto">
            {selectedFile ? (
              <Image
                src={URL.createObjectURL(selectedFile)}
                alt="Uploaded Proof"
                width={256}
                height={256}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-black dark:text-white">No Photo</span>
            )}
          </div>

          {selectedFile && (
            <button
              onClick={handleRemoveFile}
              className="mt-2 py-1 px-2 rounded-lg border border-red-600 dark:border-red-400 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-600 hover:text-white dark:hover:bg-red-400 dark:hover:text-white transition-all mx-auto"
            >
              Remove Photo
            </button>
          )}
        </div>

        {uploadError && (
          <div className="text-red-600 dark:text-red-400 mt-2 text-xs">
            {uploadError}
          </div>
        )}

        <div className="flex justify-center mt-4">
          <button
            onClick={handleUpload}
            disabled={uploading || isProfileLoading || !selectedFile}
            className={`bg-neutral-950 dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg font-semibold ${
              uploading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800 dark:hover:bg-gray-200"
            }`}
          >
            {uploading ? "Uploading..." : "Process my documents"}
          </button>
        </div>
      </div>
    </div>
  );
}
