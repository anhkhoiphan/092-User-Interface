import React, { useState, useEffect } from 'react';
import { FiX, FiSend, FiCpu, FiUser, FiInfo, FiRefreshCw, FiZap, FiCheck } from 'react-icons/fi';
import taService from '../../services/ta.service';

const AiComposeModal = ({ isOpen, onClose, context, onSend, isSending }) => {
  const [message, setMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [refineQuery, setRefineQuery] = useState('');
  const [currentTone, setCurrentTone] = useState('helpful');

  const tones = [
    { id: 'helpful', label: 'Thân thiện', icon: '😊' },
    { id: 'urgent', label: 'Nghiêm túc', icon: '⚖️' },
    { id: 'inspire', label: 'Khích lệ', icon: '🔥' },
    { id: 'casual', label: 'Gần gũi', icon: '🤝' },
  ];

  const generateMessage = async (tone = currentTone, instruction = '') => {
    if (!context?.id) return;
    setGenerating(true);
    try {
      // Sử dụng config đa tầng từ Dashboard
      const config = context.aiConfig || {};
      const g = config.global || {};
      const d = config.dm || {};

      const finalInstruction = `
[MỤC TIÊU DM]: ${d.goal || 'hỏi thăm'}
[ĐỘ DÀI]: ${d.length || 'vừa phải'}
[NGUYÊN TẮC CHUNG]: ${g.instruction || ''}
[CHỈ DẪN RIÊNG DM]: ${d.instruction || ''}
${instruction ? `[YÊU CẦU HIỆU CHỈNH]: ${instruction}` : ''}
`.trim();

      const res = await taService.generateSmartMessage(context.id, tone, {
        instruction: finalInstruction,
        pronouns: g.pronouns || 'mình - bạn',
        taName: context.taName || 'Trợ giảng'
      });

      if (res.success && res.data?.content) {
        setMessage(res.data.content);
        setCurrentTone(tone);
      }
    } catch (error) {
      console.error('AI DM Error:', error);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen && context?.id) {
      generateMessage('helpful');
    }
  }, [isOpen, context?.id]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div className="animate-fade" style={{
        width: '100%', maxWidth: '700px', background: 'var(--bg-surface-secondary)',
        borderRadius: '20px', border: '1px solid var(--border-primary)',
        boxShadow: '0 30px 60px -12px rgba(0,0,0,0.5)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh'
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-tertiary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.3)' }}>
              <FiCpu size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Trợ lý Soạn tin DM</h3>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.02em' }}>Cá nhân hóa cho học viên</div>
            </div>
          </div>
          <button onClick={onClose} className="ta-btn" style={{ padding: '8px', border: 'none', background: 'transparent' }}><FiX size={20} /></button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Student Info Card */}
          {context?.student_info && (
            <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-surface-tertiary)', borderRadius: '14px', border: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <FiUser color="var(--primary)" size={14} />
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>{context.student_info.name}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  <strong>Lý do:</strong> {context.at_risk_data?.reason || 'Cần hỗ trợ học tập'}
                </div>
              </div>
              <div style={{ padding: '4px 10px', borderRadius: '20px', background: 'var(--ta-red-bg)', color: 'var(--ta-red)', fontSize: '10px', fontWeight: 700 }}>
                {context.at_risk_data?.level?.toUpperCase()}
              </div>
            </div>
          )}

          {/* Tone Selection */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>Chọn giọng văn</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {tones.map(t => (
                <button 
                  key={t.id} 
                  className={`refine-chip ${currentTone === t.id ? 'active' : ''}`}
                  onClick={() => generateMessage(t.id)}
                  disabled={generating}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message Area */}
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            {generating && (
              <div className="processing-overlay">
                <FiRefreshCw className="spin" size={32} color="var(--primary)" />
                <span style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600 }}>AI đang soạn tin...</span>
              </div>
            )}
            <textarea 
              style={{ 
                width: '100%', height: '180px', padding: '18px', borderRadius: '14px',
                border: '1px solid var(--border-primary)', background: 'var(--bg-surface)',
                color: 'var(--text-primary)', fontSize: '15px', lineHeight: '1.7',
                outline: 'none', resize: 'none', fontFamily: 'inherit',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
              }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nội dung tin nhắn sẽ hiện ở đây..."
            />
          </div>

          {/* Refine Section Inside Modal */}
          {!generating && message && (
            <div style={{ padding: '16px', background: 'var(--bg-surface-tertiary)', borderRadius: '14px', border: '1px solid var(--border-primary)' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>✨ Yêu cầu AI sửa lại tin nhắn</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" className="ta-input" 
                  style={{ fontSize: '13px', padding: '8px 12px' }}
                  placeholder="VD: Viết ngắn lại, thêm lời chúc..." 
                  value={refineQuery} onChange={(e) => setRefineQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { generateMessage(currentTone, refineQuery); setRefineQuery(''); } }}
                />
                <button className="vibrant-btn" style={{ padding: '0 12px', minWidth: 'auto' }} onClick={() => { generateMessage(currentTone, refineQuery); setRefineQuery(''); }}>
                  <FiCheck size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-primary)', background: 'var(--bg-surface-tertiary)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="ta-btn" onClick={onClose} style={{ border: 'none' }}>Đóng</button>
          <button className="vibrant-btn" style={{ padding: '10px 24px' }} onClick={() => onSend(message)} disabled={isSending || generating || !message}>
            {isSending ? <FiRefreshCw className="spin" /> : <FiZap />} Gửi tin nhắn ngay
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiComposeModal;
