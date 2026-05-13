import React, { useState } from 'react';
import * as Icons from 'react-icons/fi';
import { marked } from 'marked';

const RecapWorkflow = (props) => {
  console.log("[RecapWorkflow] Render start...");
  
  const { 
    currentStep = 1, 
    uploading = false, 
    uploadedFile = null, 
    handleFileUpload = () => {}, 
    startAiAnalysis = () => {}, 
    aiPreview = null, 
    scheduleDate = '', 
    setScheduleDate = () => {}, 
    handleApproveSummary = () => {}, 
    handleScheduleSummary = () => {}, 
    setCurrentStep = () => {}, 
    setAiPreview = () => {}, 
    selectedSpaces = [], 
    setSelectedSpaces = () => {}, 
    taSpaces = [],
    isHitlEnabled = true,
    handleRefineAi = () => {} // New prop for refining
  } = props;

  const [isEditing, setIsEditing] = useState(false);
  const [refineQuery, setRefineQuery] = useState('');
  const [selectedChips, setSelectedChips] = useState([]);

  const refineOptions = [
    { id: 'shorter', label: '✨ Ngắn gọn', prompt: 'Làm ngắn gọn lại, súc tích hơn.' },
    { id: 'funny', label: '✨ Hài hước', prompt: 'Viết lại với giọng văn hài hước, năng lượng hơn.' },
    { id: 'professional', label: '✨ Chuyên nghiệp', prompt: 'Viết lại chuyên nghiệp và trang trọng hơn.' },
    { id: 'emoji', label: '✨ Thêm Emoji', prompt: 'Bổ sung thêm các emoji phù hợp để bài viết sinh động.' },
    { id: 'structure', label: '✨ Chia mục rõ ràng', prompt: 'Sử dụng bullet points và tiêu đề để chia bố cục rõ ràng hơn.' },
  ];

  const toggleChip = (chipId) => {
    setSelectedChips(prev => 
      prev.includes(chipId) ? prev.filter(id => id !== chipId) : [...prev, chipId]
    );
  };

  const handleApplyRefine = () => {
    const chipPrompts = selectedChips.map(id => refineOptions.find(opt => opt.id === id).prompt).join(' ');
    const finalInstruction = `${chipPrompts} ${refineQuery}`.trim();
    if (finalInstruction) {
      handleRefineAi(finalInstruction);
      setRefineQuery('');
      setSelectedChips([]);
    }
  };

  const toggleSpace = (id) => {
    if (typeof setSelectedSpaces === 'function') {
      setSelectedSpaces(prev => {
        const current = Array.isArray(prev) ? prev : [];
        return current.includes(id) ? current.filter(item => item !== id) : [...current, id];
      });
    }
  };

  const renderMarkdown = (content) => {
    return { __html: marked.parse(content || '') };
  };

  return (
    <div className="animate-fade">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', alignItems: 'start' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="ta-card-premium" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.FiSettings color="var(--primary)" /> Cấu hình đăng bài
            </h3>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', fontFamily: 'inherit' }}>
                1. Chọn các lớp nhận bài ({selectedSpaces?.length || 0})
              </label>
              <div style={{ maxHeight: '150px', overflowY: 'auto', background: 'var(--bg-surface-tertiary)', borderRadius: '12px', padding: '8px', border: '1px solid var(--border-primary)' }}>
                {Array.isArray(taSpaces) && taSpaces.map(space => (
                  <label key={space.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', cursor: 'pointer', borderRadius: '8px', transition: '0.2s', fontFamily: 'inherit' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedSpaces?.includes(space.id)} 
                      onChange={() => toggleSpace(space.id)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '14px' }}>{space.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', fontFamily: 'inherit' }}>
                2. Lịch đăng (Để trống nếu muốn gửi ngay)
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Icons.FiClock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
                <input 
                  type="datetime-local" 
                  className="ta-input" 
                  style={{ paddingLeft: '40px', fontFamily: 'inherit' }}
                  value={scheduleDate || ''}
                  onChange={(e) => setScheduleDate(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', fontFamily: 'inherit' }}>
                3. Tài liệu buổi học (Tùy chọn)
              </label>
              <div 
                style={{ border: '2px dashed var(--border-primary)', borderRadius: '12px', padding: '20px', textAlign: 'center', background: 'var(--bg-surface)', cursor: 'pointer' }}
                onClick={() => document.getElementById('slide-upload').click()}
              >
                <Icons.FiUploadCloud size={24} color="var(--primary)" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'inherit' }}>Tải Slide (PDF/Ảnh)</div>
                <input type="file" style={{ display: 'none' }} id="slide-upload" accept=".pdf,image/*" onChange={handleFileUpload} />
              </div>
              {uploadedFile && (
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--ta-green-bg)', borderRadius: '8px' }}>
                  <Icons.FiFileText color="var(--ta-green)" size={14} />
                  <span style={{ fontSize: '13px', fontFamily: 'inherit' }}>{uploadedFile.filename}</span>
                </div>
              )}
            </div>

            <button 
              className="vibrant-btn" 
              style={{ width: '100%', fontFamily: 'inherit' }}
              onClick={startAiAnalysis}
              disabled={uploading || (selectedSpaces?.length || 0) === 0}
            >
              {uploading ? <Icons.FiRefreshCw className="spin" /> : <Icons.FiZap />}
              <span>
                {isHitlEnabled 
                  ? (scheduleDate ? 'Tạo phác thảo & Đặt lịch' : 'Tạo phác thảo')
                  : (scheduleDate ? 'Tạo phác thảo & Đặt lịch' : 'Tạo phác thảo rồi gửi ngay')
                }
              </span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
          <div className="ta-card-premium" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-surface-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.FiFileText color="var(--primary)" />
                <h3 style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'inherit' }}>Nội dung Recap</h3>
              </div>
              {aiPreview && !uploading && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="ta-btn" style={{ padding: '4px 12px' }} onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? <><Icons.FiEye size={14} /> Xem</> : <><Icons.FiEdit3 size={14} /> Sửa nhanh</>}
                  </button>
                </div>
              )}
            </div>

            <div style={{ flex: 1, padding: '24px', position: 'relative', overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {uploading && (
                <div className="processing-overlay">
                  <Icons.FiCpu className="spin" size={48} color="var(--primary)" />
                  <h4 style={{ marginTop: '16px', fontWeight: 700 }}>AI đang xử lý yêu cầu...</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Bản thảo sẽ được cập nhật trong giây lát</p>
                </div>
              )}

              <div className={`markdown-content-area ${uploading ? 'blur-content' : ''}`} style={{ flex: 1, height: 'auto' }}>
                {currentStep === 1 && !aiPreview && (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: 'inherit' }}>
                    <p>Nhập thông tin bên trái để bắt đầu</p>
                  </div>
                )}
                
                {aiPreview && (
                  isEditing ? (
                    <textarea 
                      style={{ width: '100%', height: '100%', border: 'none', resize: 'none', outline: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '15px', lineHeight: '1.8', fontFamily: 'inherit' }}
                      value={aiPreview?.content || ''}
                      onChange={(e) => { if (typeof setAiPreview === 'function') setAiPreview({ ...aiPreview, content: e.target.value }); }}
                    />
                  ) : (
                    <div 
                      dangerouslySetInnerHTML={renderMarkdown(aiPreview?.content)}
                    />
                  )
                )}
              </div>
            </div>

            {(aiPreview) && (
              <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-primary)', background: 'var(--bg-surface-tertiary)', flexShrink: 0 }}>
                {/* Refine Section */}
                {!uploading && (
                  <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>✨ Tinh chỉnh nhanh cùng AI</div>
                    
                    <div className="refine-chips-container" style={{ marginBottom: '12px' }}>
                      {refineOptions.map(opt => (
                        <button 
                          key={opt.id} 
                          className={`refine-chip ${selectedChips.includes(opt.id) ? 'active' : ''}`}
                          onClick={() => toggleChip(opt.id)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" className="ta-input" 
                        style={{ padding: '8px 12px', fontSize: '13px' }}
                        placeholder="Yêu cầu riêng (vd: Nhấn mạnh deadline...)" 
                        value={refineQuery} onChange={(e) => setRefineQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleApplyRefine(); }}
                      />
                      <button 
                        className="vibrant-btn" 
                        style={{ padding: '0 12px', minWidth: 'auto', height: '38px' }}
                        disabled={selectedChips.length === 0 && !refineQuery}
                        onClick={handleApplyRefine}
                      >
                        <Icons.FiCheck size={18} />
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  {!uploading && (
                    <>
                      <button className="ta-btn" style={{ padding: '8px 16px' }} onClick={() => { if (typeof setAiPreview === 'function') setAiPreview(null); if (typeof setCurrentStep === 'function') setCurrentStep(1); }}>Hủy</button>
                      <button className="vibrant-btn" 
                        style={{ padding: '8px 20px' }}
                        onClick={() => {
                          if (aiPreview && aiPreview.id) {
                            if (!scheduleDate) handleApproveSummary(aiPreview.id, aiPreview.space_id);
                            else handleScheduleSummary(aiPreview.id, aiPreview.space_id, scheduleDate);
                          }
                        }}
                      >
                        <Icons.FiSend /> {scheduleDate ? 'Đặt lịch' : 'Gửi ngay'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default RecapWorkflow;
