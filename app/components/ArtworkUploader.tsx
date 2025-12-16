'use client';

import { useState, useRef, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import styles from './ArtworkUploader.module.css';

interface ArtworkUploaderProps {
  onUploadSuccess?: () => void;
  artworkCount?: number;
}

interface ToastState {
  show: boolean;
  message: string;
}

interface FileMetadata {
  title: string;
  medium: string;
}

export default function ArtworkUploader({ onUploadSuccess, artworkCount = 0 }: ArtworkUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [fileMetadata, setFileMetadata] = useState<FileMetadata[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3000);
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const filePromises: Promise<string>[] = [];

    Array.from(files).forEach((file) => {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert(`${file.name} is not a valid image file. Please select JPEG, PNG, or WebP images.`);
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`${file.name} is too large. Maximum file size is 10MB.`);
        return;
      }

      validFiles.push(file);
      
      // Create promise for reading file
      const previewPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            resolve(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      });
      filePromises.push(previewPromise);
    });

    // Wait for all previews to load, then update state
    Promise.all(filePromises).then((newPreviews) => {
      setPreviews((prev) => [...prev, ...newPreviews]);
      // Initialize metadata for new files
      setFileMetadata((prev) => [...prev, ...validFiles.map(() => ({ title: '', medium: '' }))]);
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  }, []);

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    const newMetadata = fileMetadata.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
    setFileMetadata(newMetadata);
  };

  const updateMetadata = (index: number, field: 'title' | 'medium', value: string) => {
    const newMetadata = [...fileMetadata];
    newMetadata[index] = { ...newMetadata[index], [field]: value };
    setFileMetadata(newMetadata);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to upload artwork.');
      }

      const totalFiles = selectedFiles.length;
      let uploadedCount = 0;

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const metadata = fileMetadata[i] || { title: '', medium: '' };
        const formData = new FormData();
        formData.append('file', file);
        if (metadata.title) {
          formData.append('title', metadata.title);
        }
        if (metadata.medium) {
          formData.append('medium', metadata.medium);
        }

        const response = await fetch('/api/artwork', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Upload error response:', errorData);
          throw new Error(errorData.error || 'Failed to upload artwork');
        }

        uploadedCount++;
        setUploadProgress((uploadedCount / totalFiles) * 100);
      }

      // Reset state
      setSelectedFiles([]);
      setPreviews([]);
      setFileMetadata([]);
      setIsOpen(false);
      showToast('Artwork added!');
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.message || 'Failed to upload artwork. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    if (!uploading) {
      setIsOpen(false);
      setSelectedFiles([]);
      setPreviews([]);
      setFileMetadata([]);
      setIsDragging(false);
    }
  };

  const baseButtonStyle = {
    fontSize: '0.95rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    fontFamily: 'var(--font-inter)',
    borderRadius: '20px',
    backgroundColor: '#ff6622',
    color: 'white',
    outline: 'none',
    border: 'none',
    textDecoration: 'none',
    transition: 'background-color 0.2s ease',
    padding: '8px 20px',
    cursor: 'pointer',
  };

  return (
    <>
      {artworkCount === 0 ? (
        <button
          onClick={openModal}
          style={{ ...baseButtonStyle, marginTop: '16px' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e55a1a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ff6622';
          }}
        >
          UPLOAD
        </button>
      ) : (
        <button
          onClick={openModal}
          className={styles.uploadButtonTopRight}
          style={baseButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e55a1a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ff6622';
          }}
        >
          UPLOAD
        </button>
      )}

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className={styles.dialog} onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter={styles.enter}
            enterFrom={styles.enterFrom}
            enterTo={styles.enterTo}
            leave={styles.leave}
            leaveFrom={styles.leaveFrom}
            leaveTo={styles.leaveTo}
          >
            <div className={styles.overlay} />
          </Transition.Child>

          <div className={styles.container}>
            <Transition.Child
              as={Fragment}
              enter={styles.enter}
              enterFrom={styles.enterFromModal}
              enterTo={styles.enterToModal}
              leave={styles.leave}
              leaveFrom={styles.leaveFromModal}
              leaveTo={styles.leaveToModal}
            >
              <Dialog.Panel className={styles.panel}>
                <Dialog.Title className={styles.title}>Upload Artwork</Dialog.Title>

                <div className={styles.content}>
                  {/* Drop Zone */}
                  <div
                    ref={dropZoneRef}
                    className={`${styles.dropZone} ${isDragging ? styles.dropZoneDragging : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      onChange={handleFileInputChange}
                      className={styles.fileInput}
                    />
                    <div className={styles.dropZoneContent}>
                      <svg
                        className={styles.dropZoneIcon}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className={styles.dropZoneText}>
                        Drag and drop images here, or click to select
                      </p>
                      <p className={styles.dropZoneSubtext}>
                        JPEG, PNG, WebP up to 10MB each
                      </p>
                    </div>
                  </div>

                  {/* Preview Thumbnails */}
                  {previews.length > 0 && (
                    <div className={styles.previews}>
                      <h3 className={styles.previewsTitle}>Selected Images ({selectedFiles.length})</h3>
                      <div className={styles.thumbnails}>
                        {previews.map((preview, index) => (
                          <div key={index} className={styles.thumbnail}>
                            <Image
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              width={120}
                              height={120}
                              className={styles.thumbnailImage}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(index);
                              }}
                              className={styles.removeButton}
                              disabled={uploading}
                            >
                              ×
                            </button>
                            <p className={styles.thumbnailName}>
                              {selectedFiles[index]?.name || `Image ${index + 1}`}
                            </p>
                            <div className={styles.metadataFields}>
                              <input
                                type="text"
                                placeholder="Title (optional)"
                                value={fileMetadata[index]?.title || ''}
                                onChange={(e) => updateMetadata(index, 'title', e.target.value)}
                                className={styles.metadataInput}
                                disabled={uploading}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <input
                                type="text"
                                placeholder="Medium (optional)"
                                value={fileMetadata[index]?.medium || ''}
                                onChange={(e) => updateMetadata(index, 'medium', e.target.value)}
                                className={styles.metadataInput}
                                disabled={uploading}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Progress Bar */}
                  {uploading && (
                    <div className={styles.progressContainer}>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className={styles.progressText}>
                        Uploading... {Math.round(uploadProgress)}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                  <button
                    onClick={closeModal}
                    className={styles.cancelButton}
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    className={styles.uploadButton}
                    disabled={selectedFiles.length === 0 || uploading}
                  >
                    {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} ${selectedFiles.length === 1 ? 'Image' : 'Images'}`}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Toast Notification */}
      {toast.show && (
        <div className={styles.toast}>
          {toast.message}
        </div>
      )}
    </>
  );
}

