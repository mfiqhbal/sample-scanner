'use client';

import { useRef, useState, useCallback } from 'react';

interface ImageUploaderProps {
  onUpload: (file: File) => void;
}

export function ImageUploader({ onUpload }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onUpload(file);
    }
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
        onUpload(file);
      }
    },
    [onUpload]
  );

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
        transition-colors duration-200
        ${isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <svg
        className={`w-12 h-12 mx-auto mb-3 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>

      <p className={`font-medium ${isDragging ? 'text-blue-600' : 'text-slate-600'}`}>
        {isDragging ? 'Drop image here' : 'Tap to upload image'}
      </p>
      <p className="text-sm text-slate-400 mt-1">or drag and drop</p>
    </div>
  );
}
