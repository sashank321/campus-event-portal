import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { detailRequest, uploadGalleryRequest } from '../../api/client';
import { dateLabel } from '../../lib/events';
import { Skeleton, ErrorState } from '../../components/ui';

export default function GalleryManager() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const query = useQuery({
    queryKey: ['event', slug],
    queryFn: ({ signal }) => detailRequest(slug, signal),
  });

  const event = query.data?.data?.event;
  const eventId = event?._id;
  const gallery = event?.gallery || [];
  const isMaxCapacity = gallery.length >= 10;

  const uploadMutation = useMutation({
    mutationFn: async ({ id, file, captionText }) => {
      const formData = new FormData();
      formData.append('image', file);
      if (captionText) formData.append('caption', captionText);
      return uploadGalleryRequest(id, formData);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['event', slug] });
      void queryClient.invalidateQueries({ queryKey: ['organizer'] });
      setSelectedFile(null);
      setCaption('');
      setPreviewUrl(null);
      setFileError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSuccessMsg('Image uploaded successfully to the event gallery!');
      setTimeout(() => setSuccessMsg(null), 5000);
    },
    onError: (err) => {
      setFileError(err.message || 'Failed to upload gallery image.');
    },
  });

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    setFileError(null);
    setSuccessMsg(null);

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Client validations
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('Supported formats: JPEG, PNG, WebP only.');
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size exceeds 5MB limit. Please choose a smaller image.');
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!selectedFile || !eventId) return;
    if (isMaxCapacity) {
      setFileError('Maximum gallery limit (10 images) reached.');
      return;
    }
    uploadMutation.mutate({ id: eventId, file: selectedFile, captionText: caption.trim() });
  }

  if (query.isPending) {
    return <Skeleton count={3} />;
  }

  if (query.isError) {
    return <ErrorState title="We couldn’t load this event." error={query.error} retry={query.refetch} />;
  }

  if (!event) {
    return (
      <div className="empty-state">
        <h2>Event not found</h2>
        <Link className="button" to="/organizer/events">
          Back to managed events
        </Link>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: '1.5rem' }}>
      {/* Back link */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to={`/organizer/events/${event.slug}`} className="text-link" style={{ fontSize: '0.875rem' }}>
          ← Back to {event.title}
        </Link>
        <Link to={`/events/${event.slug}`} className="text-link" style={{ fontSize: '0.875rem' }}>
          View public page ↗
        </Link>
      </div>

      {/* Header card */}
      <div className="form-section">
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>GALLERY MANAGEMENT</p>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0' }}>
            Event Photos: {event.title}
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: '0.875rem' }}>
            Showcase moments, posters, and stage highlights. (<strong>{gallery.length}</strong> of 10 maximum images uploaded)
          </p>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="stack" style={{ gap: '1rem', marginTop: '0.5rem' }}>
          {isMaxCapacity ? (
            <div
              role="status"
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '8px',
                padding: '0.875rem 1rem',
                color: '#fde68a',
                fontSize: '0.875rem',
              }}
            >
              <strong>Gallery full:</strong> This event already contains the maximum allowed 10 images.
            </div>
          ) : (
            <>
              <div
                className="dropzone"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label="Upload gallery image"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                {previewUrl ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <img
                      src={previewUrl}
                      alt="Upload preview"
                      style={{ maxHeight: '180px', maxWidth: '100%', borderRadius: '6px', objectFit: 'contain' }}
                    />
                    <span style={{ fontSize: '0.8125rem', color: '#10b981' }}>
                      ✓ {selectedFile?.name} ({(selectedFile?.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                    <span className="muted" style={{ fontSize: '0.75rem' }}>
                      Click to choose a different photo
                    </span>
                  </div>
                ) : (
                  <div>
                    <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📸</span>
                    <p style={{ margin: 0, fontWeight: 600, color: '#f8fafc' }}>
                      Click or drop a photo here to upload
                    </p>
                    <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem' }}>
                      JPEG, PNG, or WebP up to 5MB
                    </p>
                  </div>
                )}
              </div>

              {/* Caption input */}
              <div>
                <label className="field-label" htmlFor="gallery-caption">
                  Image Caption <span className="muted" style={{ fontWeight: 400 }}>(Optional, max 200 chars)</span>
                </label>
                <input
                  id="gallery-caption"
                  type="text"
                  maxLength={200}
                  placeholder="e.g. Keynote presentation in Main Auditorium"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="input-field"
                  disabled={uploadMutation.isPending}
                />
                <span className="muted" style={{ fontSize: '0.75rem', float: 'right', marginTop: '0.25rem' }}>
                  {caption.length} / 200
                </span>
              </div>

              {fileError && <p className="field-error">{fileError}</p>}
              {successMsg && (
                <p style={{ color: '#34d399', fontSize: '0.875rem', margin: 0 }}>
                  ✓ {successMsg}
                </p>
              )}

              <div>
                <button
                  type="submit"
                  className="button button-small"
                  disabled={!selectedFile || uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? 'Uploading photo…' : 'Upload to Gallery'}
                </button>
              </div>
            </>
          )}

          {/* Limitation Note */}
          <div
            role="note"
            aria-label="Gallery contract note"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              fontSize: '0.8125rem',
              color: '#94a3b8',
            }}
          >
            <strong>ℹ️ Gallery Policy:</strong> Uploads are permanently attached to this event record. Deleting or reordering individual photos is not currently supported by the campus API contract.
          </div>
        </form>
      </div>

      {/* Gallery Grid */}
      <div className="form-section">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
          Current Gallery ({gallery.length})
        </h2>

        {gallery.length === 0 ? (
          <div className="empty-state">
            <div className="empty-orbit" aria-hidden="true">📷</div>
            <h2>No images uploaded yet</h2>
            <p>Use the form above to add your first event highlight photo.</p>
          </div>
        ) : (
          <div className="gallery-grid" style={{ marginTop: '0.5rem' }}>
            {gallery.map((img, idx) => (
              <div
                key={img._id || idx}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div className="gallery-thumbnail">
                  <img src={img.url} alt={img.caption || `Gallery photo ${idx + 1}`} />
                </div>
                <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', flexGrow: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#f8fafc', fontWeight: 500, lineHeight: 1.4 }}>
                    {img.caption || <span className="muted">No caption provided</span>}
                  </p>
                  <span className="muted" style={{ fontSize: '0.75rem', marginTop: 'auto' }}>
                    Uploaded {img.uploadedAt ? dateLabel(img.uploadedAt) : 'recently'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
