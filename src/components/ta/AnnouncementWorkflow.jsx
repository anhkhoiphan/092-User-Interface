import React, { useState } from 'react';
import { 
  FiMessageSquare, FiSend, FiCpu, FiCheckCircle, FiZap, FiEye, FiClock, FiTrash2, FiRefreshCw, FiSettings, FiCheck, FiX, FiEdit3, FiCornerDownLeft
} from 'react-icons/fi';
import { marked } from 'marked';

const AnnouncementWorkflow = ({ 
  onGenerate, 
  loading, 
  aiPreview, 
  setAiPreview, 
  handleApprove, 
  handleSchedule,
  scheduleDate,
  setScheduleDate,
  selectedSpaces,
  setSelectedSpaces,
  taSpaces,
  isHitlEnabled,
  handleRefineAi = () => {}
}) => {
  const [purpose, setPurpose] = useState('Thông báo chung');
  const [context, setContext] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [refineQuery, setRefineQuery] = useState('');
  const [selectedChips, setSelectedChips] = useState([]);

  const refineOptions = [
    { id: 'shorter', label: '✨ Ngắn gọn', prompt: 'Làm ngắn gọn lại, súc tích hơn.' },
    { id: 'funny', label: '✨ Hài hước', prompt: 'Viết lại với giọng văn hài hước, năng lượng hơn.' },
    { id: 'professional', label: '✨ Chuyên nghiệp', prompt: 'Viết lại chuyên nghiệp và trang trọng hơn.' },
    { id: 'emoji', label: '✨ Thêm Emoji', prompt: 'Bổ sung thêm các emoji phù hợp.' },
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

  const purposes = [
    'Thông báo chung',
    'Nhắc nhở Deadline',
    'Lịch thi/Kiểm tra',
    'Thay đổi giờ học',
    'Điểm danh lớp học'
  ];

  const toggleSpace = (id) => {
    setSelectedSpaces(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const renderMarkdown = (content) => {
    return { __html: marked.parse(content || '') };
  };

  return (
    <div className="animate-fade">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Step 1: Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="ta-card-premium" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiSettings color="var(--primary)" /> Soạn thông báo
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
                1. Chọn lớp nhận ({selectedSpaces.length})
              </label>
              <div style={{ maxHeight: '120px', overflowY: 'auto', background: 'var(--bg-surface-tertiary)', borderRadius: '12px', padding: '8px', border: '1px solid var(--border-primary)' }}>
                {taSpaces.map(space => (
                  <label key={space.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', cursor: 'pointer', borderRadius: '8px' }}>
                    <input type="checkbox" checked={selectedSpaces.includes(space.id)} onChange={() => toggleSpace(space.id)} />
                    <span style={{ fontSize: '14px' }}>{space.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>2. Mục đích</label>
                <select className="modern-select" style={{ width: '100%' }} value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                  {purposes.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>3. Nội dung chính</label>
                <textarea 
                  className="ta-input" style={{ minHeight: '100px', resize: 'vertical' }}
                  placeholder="Ví dụ: Nhắc lớp nộp bài tập SQL..."
                  value={context} onChange={(e) => setContext(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>4. Lịch đăng (Tùy chọn)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <FiClock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
                  <input type="datetime-local" className="ta-input" style={{ paddingLeft: '40px' }} value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
                </div>
              </div>
            </div>

            <button className="vibrant-btn" style={{ width: '100%' }} onClick={() => onGenerate(purpose, context)} disabled={loading || !context || selectedSpaces.length === 0}>
              {loading ? <FiRefreshCw className="spin" /> : <FiZap />}
              <span>{isHitlEnabled ? (scheduleDate ? 'Tạo thông báo & Đặt lịch' : 'Tạo thông báo') : (scheduleDate ? 'Tạo thông báo & Đặt lịch' : 'Tạo thông báo rồi gửi ngay')}</span>
            </button>
          </div>
        </div>

        {/* Step 2: Content Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="ta-card-premium" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-surface-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiMessageSquare color="var(--primary)" />
                <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Bản thảo AI</h3>
              </div>
              {aiPreview && !loading && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="ta-btn" style={{ padding: '4px 12px' }} onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? <><FiEye size={14} /> Xem</> : <><FiEdit3 size={14} /> Sửa nhanh</>}
                  </button>
                </div>
              )}
            </div>

            <div style={{ flex: 1, padding: '24px', position: 'relative', overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {loading && (
                <div className="processing-overlay">
                  <FiCpu className="spin" size={48} color="var(--primary)" />
                  <h4 style={{ marginTop: '16px', fontWeight: 700 }}>AI đang soạn nội dung...</h4>
                </div>
              )}

              <div className={`markdown-content-area ${loading ? 'blur-content' : ''}`} style={{ flex: 1, height: 'auto' }}>
                {aiPreview ? (
                  isEditing ? (
                    <textarea 
                      className="ta-input" style={{ width: '100%', height: '100%', border: 'none', resize: 'none', outline: 'none', background: 'transparent' }}
                      value={aiPreview.content} onChange={(e) => setAiPreview({...aiPreview, content: e.target.value})}
                    />
                  ) : (
                    <div dangerouslySetInnerHTML={renderMarkdown(aiPreview.content)} />
                  )
                ) : (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <p>Nhập thông tin bên trái để bắt đầu</p>
                  </div>
                )}
              </div>
            </div>

            {aiPreview && !loading && (
              <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-primary)', background: 'var(--bg-surface-tertiary)', flexShrink: 0 }}>
                {/* Refine Section */}
                <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>✨ Tinh chỉnh cùng AI</div>
                  <div className="refine-chips-container" style={{ marginBottom: '12px' }}>
                    {refineOptions.map(opt => (
                      <button key={opt.id} className={`refine-chip ${selectedChips.includes(opt.id) ? 'active' : ''}`} onClick={() => toggleChip(opt.id)}>{opt.label}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" className="ta-input" style={{ padding: '8px 12px', fontSize: '13px' }} placeholder="Ghi thêm yêu cầu..." value={refineQuery} onChange={(e) => setRefineQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleApplyRefine(); }} />
                    <button className="vibrant-btn" style={{ padding: '0 12px', minWidth: 'auto', height: '38px' }} disabled={selectedChips.length === 0 && !refineQuery} onClick={handleApplyRefine}><FiCheck size={18} /></button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button className="ta-btn" onClick={() => setAiPreview(null)}>Hủy bỏ</button>
                  <button className="vibrant-btn" onClick={() => {
                    if (!scheduleDate) handleApprove(aiPreview.id, aiPreview.space_id);
                    else handleSchedule(aiPreview.id, aiPreview.space_id, scheduleDate);
                  }}>
                    <FiSend /> {scheduleDate ? 'Xác nhận Đặt lịch' : 'Xác nhận Gửi ngay'}
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

export default AnnouncementWorkflow;
