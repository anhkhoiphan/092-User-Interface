import React, { useState, useEffect } from 'react';
import { 
  FiX, FiSend, FiCpu, FiMessageCircle, FiSmile, FiUser, 
  FiInfo, FiCopy, FiCheck, FiAlertCircle, FiTrendingUp 
} from 'react-icons/fi';
import taService from '../../services/ta.service';

const AiComposeModal = ({ isOpen, onClose, context, onSend, isSending }) => {
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState('helpful');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && context) {
      console.log('[AI-COMPOSE] Nhận context mới cho học viên:', context.student_info?.name);
      generateDraft();
    }
  }, [isOpen, context, tone]);

  const generateDraft = async () => {
    if (!context?.id) return;
    
    setLoading(true);
    try {
      const data = await taService.generateSmartMessage(context.id, tone);
      // Đảm bảo dữ liệu là chuỗi văn bản
      const content = typeof data.content === 'object' 
        ? (data.content.answer || data.content.content || JSON.stringify(data.content))
        : data.content;
      setDraft(content);
    } catch (error) {
      console.error('Failed to generate AI draft:', error);
      setDraft('❌ Lỗi khi kết nối với AI Agent. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !context) return null;

  // Render an toàn cho lý do rủi ro
  const safeSignals = Array.isArray(context?.at_risk_data?.signals) 
    ? context.at_risk_data.signals.join(', ') 
    : 'Chưa có tín hiệu cụ thể';

  return (
    <div className="ta-modal-overlay animate-fade" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center',
      alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)'
    }}>
      <div className="ta-modal-card" style={{
        background: 'var(--ta-bg)', width: '600px', borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)', overflow: 'hidden',
        border: '1px solid var(--ta-border)'
      }}>
        <div className="modal-head" style={{
          padding: '20px', borderBottom: '1px solid var(--ta-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--ta-bg2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'var(--ta-accent-bg)', color: 'var(--ta-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FiCpu size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>Agent Soạn tin thông minh</div>
              <div style={{ fontSize: '11px', color: 'var(--ta-text3)' }}>Hỗ trợ: {context?.student_info?.name || 'Học viên'}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--ta-text3)', cursor: 'pointer' }}>
            <FiX size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '20px' }}>
            <div className="context-panel" style={{ fontSize: '12px' }}>
              <label style={{ fontWeight: 700, color: 'var(--ta-text3)', textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>Tình trạng học viên</label>
              <div style={{ background: 'var(--ta-bg2)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiAlertCircle color={context?.at_risk_data?.level === 'critical' ? 'var(--ta-red)' : 'var(--ta-amber)'} />
                  <span>Cấp độ: {(context?.at_risk_data?.level || 'warning').toUpperCase()}</span>
                </div>
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiInfo color="var(--ta-blue)" />
                  <span style={{lineHeight: '1.4'}}>Lý do: {safeSignals}</span>
                </div>
              </div>

              <label style={{ fontWeight: 700, color: 'var(--ta-text3)', textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>Chọn giọng văn</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { id: 'helpful', label: 'Hỗ trợ', icon: <FiSmile /> },
                  { id: 'urgent', label: 'Nghiêm túc', icon: <FiAlertCircle /> },
                  { id: 'inspire', label: 'Khích lệ', icon: <FiTrendingUp /> }
                ].map(t => (
                  <button key={t.id} onClick={() => setTone(t.id)} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px',
                    borderRadius: '8px', border: '1px solid ' + (tone === t.id ? 'var(--ta-accent)' : 'var(--ta-border)'),
                    background: tone === t.id ? 'var(--ta-accent-bg)' : 'transparent',
                    color: tone === t.id ? 'var(--ta-accent)' : 'var(--ta-text2)',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer', textAlign: 'left'
                  }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="draft-panel">
              <label style={{ fontWeight: 700, color: 'var(--ta-text3)', textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>Bản thảo từ AI</label>
              <div style={{ position: 'relative' }}>
                {loading ? (
                  <div style={{
                    height: '200px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', background: 'var(--ta-bg2)',
                    borderRadius: '12px', gap: '10px'
                  }}>
                    <FiCpu className="spin" size={24} color="var(--ta-accent)" />
                    <span style={{ fontSize: '12px', color: 'var(--ta-text3)' }}>Đang soạn tin...</span>
                  </div>
                ) : (
                  <>
                    <textarea 
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      style={{
                        width: '100%', height: '200px', background: 'var(--ta-bg2)',
                        border: '1px solid var(--ta-border)', borderRadius: '12px',
                        padding: '15px', fontSize: '13px', lineHeight: '1.6',
                        color: 'var(--ta-text)', outline: 'none', resize: 'none'
                      }}
                    />
                    <div style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'flex', gap: '8px' }}>
                      <button onClick={handleCopy} className="ta-btn" style={{ padding: '6px 12px', fontSize: '11px' }}>
                        {copied ? <><FiCheck /> Copied</> : <><FiCopy /> Copy</>}
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--ta-text3)', display: 'flex', gap: '6px' }}>
                <FiInfo /> TA có thể chỉnh sửa lại bản thảo trước khi gửi.
              </div>
            </div>
          </div>
        </div>

        <div className="modal-foot" style={{
          padding: '20px', borderTop: '1px solid var(--ta-border)',
          display: 'flex', justifyContent: 'flex-end', gap: '12px'
        }}>
          <button onClick={onClose} className="ta-btn" style={{ padding: '10px 24px' }}>Hủy bỏ</button>
          <button 
            onClick={() => onSend(draft)} 
            className="vibrant-btn" 
            style={{ padding: '10px 32px', display: 'flex', alignItems: 'center', gap: '8px' }}
            disabled={loading || isSending || !draft}
          >
            {isSending ? <FiCpu className="spin" /> : <FiSend />}
            {isSending ? 'Đang gửi...' : 'Gửi tin nhắn'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiComposeModal;
