import React, { useState } from 'react';
import * as Icons from 'react-icons/fi';
import { marked } from 'marked';

const RecapWorkflow = (props) => {
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
    handleRefineAi = () => {},
    onGenerateQuiz = null,
    generatingQuiz = false
  } = props;

  const [isEditing, setIsEditing] = useState(false);
  const [refineQuery, setRefineQuery] = useState('');
  const [selectedChips, setSelectedChips] = useState([]);

  // Use deadlines from aiPreview if available, otherwise fall back to empty array
  const deadlines = (aiPreview?.deadlines && Array.isArray(aiPreview.deadlines) && aiPreview.deadlines.length > 0)
    ? aiPreview.deadlines
    : [];

  const renderMarkdown = (content) => {
    return { __html: marked.parse(content || '') };
  };

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

  return (
    <div className="animate-fade">
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>

        {/* Left Panel - Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="ta-card-premium" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit' }}>
              <Icons.FiSettings color="var(--primary)" /> Cấu hình
            </h3>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', fontFamily: 'inherit' }}>
                1. Chọn lớp ({selectedSpaces?.length || 0})
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
                2. Tài liệu (Tùy chọn)
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
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--ta-green-bg)', borderRadius: '8px', fontFamily: 'inherit' }}>
                  <Icons.FiFileText color="var(--ta-green)" size={14} />
                  <span style={{ fontSize: '13px' }}>{uploadedFile.filename}</span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', fontFamily: 'inherit' }}>
                3. Lịch đăng (Để trống = gửi ngay)
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

        {/* Right Panel - Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="ta-card-premium" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', overflow: 'hidden', position: 'relative' }}>

            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-surface-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.FiFileText color="var(--primary)" size={18} />
                <h3 style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'inherit' }}>Bản thảo Recap</h3>
              </div>
              {aiPreview && !uploading && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="ta-btn" style={{ padding: '4px 12px', fontFamily: 'inherit' }} onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? <><Icons.FiEye size={14} /> Xem</> : <><Icons.FiEdit3 size={14} /> Sửa</>}
                  </button>
                </div>
              )}
            </div>

            {/* Processing Overlay */}
            {uploading && (
              <div className="processing-overlay-card">
                <div className="processing-card-content">
                  <Icons.FiCpu className="spin" size={48} color="var(--primary)" />
                  <div style={{ textAlign: 'center' }}>
                    <h4 className="processing-card-title">AI đang phân tích...</h4>
                    <p className="processing-card-text">Đang đọc file và tạo tóm tắt bài giảng</p>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!aiPreview && !uploading && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: 'inherit', padding: '40px' }}>
                <Icons.FiFileText size={56} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <p style={{ fontSize: '15px' }}>Chọn lớp và nhấn tạo phác thảo để bắt đầu</p>
              </div>
            )}

            {/* Scrollable Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

              {/* AI Preview Content - 3 Columns */}
              {aiPreview && !uploading && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>

                  {/* Column 1: Tóm tắt bài giảng */}
                  <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-primary)', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', background: 'var(--bg-surface-tertiary)', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <Icons.FiFileText size={16} color="var(--primary)" />
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, fontFamily: 'inherit' }}>Tóm tắt bài giảng</h4>
                    </div>
                    <div style={{ flex: 1, padding: '18px', overflowY: 'auto', minHeight: '300px', maxHeight: '500px' }}>
                      {isEditing ? (
                        <textarea
                          className="ta-input"
                          style={{ width: '100%', height: '100%', minHeight: '300px', border: 'none', resize: 'vertical', outline: 'none', background: 'transparent', fontSize: '14px', lineHeight: '1.7', fontFamily: 'inherit', padding: '12px' }}
                          value={aiPreview?.content || ''}
                          onChange={(e) => { if (typeof setAiPreview === 'function') setAiPreview({ ...aiPreview, content: e.target.value }); }}
                        />
                      ) : (
                        <div
                          className="markdown-content"
                          dangerouslySetInnerHTML={renderMarkdown(aiPreview?.content)}
                          style={{ fontSize: '14px', lineHeight: '1.7' }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Column 2: Deadlines */}
                  <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-primary)', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', background: 'var(--bg-surface-tertiary)', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <Icons.FiCalendar size={16} color="var(--ta-amber)" />
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, fontFamily: 'inherit' }}>Deadlines</h4>
                    </div>
                    <div style={{ flex: 1, padding: '18px', overflowY: 'auto', minHeight: '300px', maxHeight: '500px' }}>
                      {deadlines && deadlines.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {deadlines.map((deadline, idx) => (
                            <div key={idx} style={{ padding: '12px', background: 'var(--bg-surface-tertiary)', borderRadius: '8px', borderLeft: '3px solid var(--ta-amber)', fontSize: '13px', lineHeight: '1.5' }}>
                              <div style={{ fontWeight: 600, marginBottom: '4px' }}>{deadline.title || deadline}</div>
                              {deadline.due_date && (
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  📅 {deadline.due_date}
                                </div>
                              )}
                              {deadline.description && (
                                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                                  {deadline.description}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '200px', color: 'var(--text-muted)', gap: '8px' }}>
                          <Icons.FiCalendar size={32} opacity={0.3} />
                          <span style={{ fontSize: '13px' }}>Không có deadline nào</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Tài liệu đính kèm */}
                  <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-primary)', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', background: 'var(--bg-surface-tertiary)', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <Icons.FiPaperclip size={16} color="var(--ta-blue)" />
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, fontFamily: 'inherit' }}>Tài liệu</h4>
                    </div>
                    <div style={{ flex: 1, padding: '18px', overflowY: 'auto', minHeight: '300px', maxHeight: '500px' }}>
                      {uploadedFile ? (
                        <div style={{ padding: '14px', background: 'var(--bg-surface-tertiary)', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'inherit', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Icons.FiFileText size={16} /> {uploadedFile.filename}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'inherit' }}>Đã tải lên và phân tích</div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '200px', color: 'var(--text-muted)', gap: '8px' }}>
                          <Icons.FiPaperclip size={32} opacity={0.3} />
                          <span style={{ fontSize: '13px' }}>Không có tài liệu</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Action Footer */}
            {aiPreview && !uploading && (
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-primary)', background: 'var(--bg-surface-tertiary)', flexShrink: 0 }}>
                {/* Refine Section */}
                <div style={{ marginBottom: '12px', padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'inherit' }}>✨ Tinh chỉnh nhanh cùng AI</div>

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
                      style={{ padding: '8px 12px', fontSize: '13px', flex: 1 }}
                      placeholder="Yêu cầu riêng (vd: Ngắn gọn hơn...)"
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

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button className="ta-btn" style={{ padding: '8px 16px', fontFamily: 'inherit' }} onClick={() => { if (typeof setAiPreview === 'function') setAiPreview(null); }}>Hủy</button>
                  {typeof onGenerateQuiz === 'function' && (
                    <button
                      className="ta-btn"
                      style={{ padding: '8px 16px', fontFamily: 'inherit' }}
                      onClick={() => onGenerateQuiz(aiPreview)}
                      disabled={generatingQuiz}
                    >
                      {generatingQuiz ? <Icons.FiRefreshCw className="spin" /> : <Icons.FiHelpCircle />}
                      {generatingQuiz ? 'Đang tạo quiz...' : 'Tạo quiz từ recap'}
                    </button>
                  )}
                  <button className="vibrant-btn"
                    style={{ padding: '8px 20px', fontFamily: 'inherit' }}
                    onClick={() => {
                      if (aiPreview && aiPreview.id) {
                        if (!scheduleDate) handleApproveSummary(aiPreview.id, aiPreview.space_id);
                        else handleScheduleSummary(aiPreview.id, aiPreview.space_id, scheduleDate);
                      }
                    }}
                  >
                    <Icons.FiSend /> {scheduleDate ? 'Đặt lịch' : 'Gửi ngay'}
                  </button>
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
