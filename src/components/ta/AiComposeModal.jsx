import React, { useState, useEffect } from 'react';
import { FiX, FiSend, FiCpu, FiUser, FiInfo, FiRefreshCw } from 'react-icons/fi';
import taService from '../../services/ta.service';

const AiComposeModal = ({ isOpen, onClose, context, onSend, isSending }) => {
  const [message, setMessage] = useState('');
  const [generating, setGenerating] = useState(false);

  // Gọi API generateSmartMessage thực tế từ backend
  const generateMessage = async (tone = 'pro') => {
    if (!context?.id) return;
    setGenerating(true);
    try {
      // Backend: generateSmartMessage(snapshotId, tone, userId)
      const res = await taService.generateSmartMessage(context.id, tone);
      if (res.success && res.data?.content) {
        setMessage(res.data.content);
      } else {
        // Fallback prompt nếu API không trả về content
        const defaultMsg = `Chào ${context.student_info?.name || 'bạn'}, mình là AI trợ giúp từ đội ngũ TA. Mình nhận thấy bạn vắng mặt trong các buổi học gần đây. Không biết bạn có gặp khó khăn gì cần hỗ trợ không?`;
        setMessage(defaultMsg);
      }
    } catch (error) {
      console.error('Lỗi gọi AI soạn tin:', error);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen && context?.id) {
      generateMessage(); // Tự động soạn tin khi mở modal
    }
  }, [isOpen, context?.id]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div className="animate-fade" style={{
        width: '100%', maxWidth: '600px', background: 'var(--bg-surface-secondary)',
        borderRadius: '16px', border: '1px solid var(--border-primary)',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-active)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiCpu />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Soạn tin nhắn hỗ trợ AI</h3>
          </div>
          <button onClick={onClose} className="ta-btn" style={{ padding: '4px', border: 'none', background: 'transparent' }}><FiX size={20} /></button>
        </div>

        <div style={{ padding: '24px' }}>
          {context?.student_info && (
            <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-surface-tertiary)', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <FiUser color="var(--primary)" />
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{context.student_info.name}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                <strong>Lý do rủi ro:</strong> {context.at_risk_data?.signals?.join(', ') || 'Vắng mặt lâu ngày'}
              </div>
            </div>
          )}

          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
            <label style={{fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase'}}>Nội dung tin nhắn</label>
            <div style={{display: 'flex', gap: '4px'}}>
               <button className="ta-btn" style={{padding: '2px 8px', fontSize: '10px'}} onClick={() => generateMessage('encouraging')} disabled={generating}>Khích lệ</button>
               <button className="ta-btn" style={{padding: '2px 8px', fontSize: '10px'}} onClick={() => generateMessage('pro')} disabled={generating}>Chuyên nghiệp</button>
            </div>
          </div>

          <textarea 
            style={{ 
              width: '100%', height: '160px', padding: '16px', borderRadius: '12px',
              border: '1px solid var(--border-primary)', background: 'var(--bg-surface)',
              color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.6',
              outline: 'none', resize: 'none', fontFamily: 'inherit'
            }}
            value={generating ? 'AI đang soạn thảo tin nhắn cá nhân hóa...' : message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={generating}
          />

          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', padding: '12px', background: 'var(--primary-active)', borderRadius: '8px' }}>
            <FiInfo size={16} style={{flexShrink: 0, marginTop: '2px'}} />
            <span>Tin nhắn này sẽ được gửi trực tiếp đến hộp thư cá nhân của học viên qua DM.</span>
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-primary)', background: 'var(--bg-surface-tertiary)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="ta-btn" onClick={onClose} style={{border: 'none'}}>Hủy bỏ</button>
          <button className="vibrant-btn" onClick={() => onSend(message)} disabled={isSending || generating || !message}>
            {isSending ? <FiRefreshCw className="spin" /> : <FiSend />} Gửi tin nhắn ngay
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiComposeModal;
