import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiAlertCircle, FiCheckCircle, FiMessageSquare, FiRefreshCw, 
  FiTrash2, FiEdit, FiClock, FiUsers, FiFileText, FiCalendar, 
  FiSettings, FiShare2, FiMoreVertical, FiTrendingUp, FiActivity, FiCpu, FiInfo, FiUploadCloud, FiSend, FiChevronRight 
} from 'react-icons/fi';
import taService from '../services/ta.service';
import './TADashboard.css';

const TADashboard = () => {
  const { activeSpace } = useSelector((state) => state.app);
  const [atRiskList, setAtRiskList] = useState([]);
  const [summaryQueue, setSummaryQueue] = useState([]);
  const [actionLogs, setActionLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('at-risk');
  const [aiContext, setAiContext] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  
  // AI Flow State
  const [currentStep, setCurrentStep] = useState(1); 
  const [aiPreview, setAiPreview] = useState(null);
  const [sendTime, setSendTime] = useState('now');
  const [scheduleDate, setScheduleDate] = useState('');

  const fetchData = async () => {
    if (!activeSpace) return;
    setLoading(true);
    try {
      const [atRiskRes, queueRes, logsRes] = await Promise.allSettled([
        taService.getAtRiskList(activeSpace),
        taService.getSummaryQueue(activeSpace),
        taService.getActionLogs(activeSpace)
      ]);

      if (atRiskRes.status === 'fulfilled') setAtRiskList(atRiskRes.value.data || []);
      if (queueRes.status === 'fulfilled') setSummaryQueue(queueRes.value.data || []);
      if (logsRes.status === 'fulfilled') setActionLogs(logsRes.value.data || []);
    } catch (error) {
      console.error('Failed to fetch TA Dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [activeSpace]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await taService.uploadSlide(activeSpace, file);
      setUploadedFile(res.data);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const startAiAnalysis = () => {
    setCurrentStep(2);
    setTimeout(() => {
      setAiPreview({
        content: `Tóm tắt buổi học hôm nay:\n\n1. Chúng ta đã học về React Hooks nâng cao (useMemo, useCallback).\n2. Cách tối ưu hiệu năng và các lỗi thường gặp khi sử dụng useEffect.\n3. Thảo luận về kiến trúc Atomic Design trong việc chia component.\n\n📌 Bài tập về nhà: Hoàn thiện Dashboard cho dự án cá nhân và nộp trước 23h ngày mai.`,
        source: uploadedFile?.filename
      });
      setCurrentStep(3);
    }, 3000);
  };

  const handleResolveAlert = async (id) => {
    try {
      await taService.resolveAlert(id, activeSpace);
      await fetchData();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const handleApproveSummary = async () => {
    try {
      await fetchData();
      setCurrentStep(1);
      setAiPreview(null);
      setUploadedFile(null);
      alert(sendTime === 'now' ? 'Bản tóm tắt đã được đăng!' : `Đã hẹn lịch gửi vào lúc: ${scheduleDate}`);
    } catch (error) {
      console.error('Failed to approve summary:', error);
    }
  };

  const handleScanAtRisk = async () => {
    setLoading(true);
    try {
      await taService.scanAtRisk(activeSpace);
      await fetchData();
    } catch (error) {
      console.error('Failed to scan at-risk:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetAiContext = async (snapshotId) => {
    try {
      const res = await taService.getAtRiskContext(snapshotId, activeSpace);
      setAiContext({ id: snapshotId, ...res.data });
    } catch (error) {
      console.error('Failed to get AI Context:', error);
    }
  };

  const criticalCount = atRiskList.filter(s => s.level === 'critical').length;
  const warningCount = atRiskList.filter(s => s.level === 'warning').length;

  return (
    <div className="ta-dashboard-container">
      {/* Internal Sidebar */}
      <aside className="ta-internal-sidebar">
        <div className="sb-head">
          <div className="sb-title">Quản lý TA</div>
          <div className="sb-sub">{activeSpace?.substring(0, 8)}...</div>
        </div>
        <div className="sb-section">Chức năng chính</div>
        <div className={`sb-item ${activeTab === 'at-risk' ? 'active' : ''}`} onClick={() => setActiveTab('at-risk')}>
          <div className="sb-icon" style={{background: 'var(--ta-red-bg)', color: 'var(--ta-red)'}}><FiAlertCircle /></div>
          <span>At-Risk Alert</span>
          {atRiskList.length > 0 && <span className="ta-badge badge-red" style={{marginLeft: 'auto'}}>{atRiskList.length}</span>}
        </div>
        <div className={`sb-item ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
          <div className="sb-icon" style={{background: 'var(--ta-accent-bg)', color: 'var(--ta-accent)'}}><FiFileText /></div>
          <span>AI Summary Queue</span>
          {summaryQueue.length > 0 && <span className="ta-badge badge-amber" style={{marginLeft: 'auto'}}>{summaryQueue.length}</span>}
        </div>
        <div className={`sb-item ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
          <div className="sb-icon" style={{background: 'var(--ta-blue-bg)', color: 'var(--ta-blue)'}}><FiActivity /></div>
          <span>Nhật ký hành động</span>
        </div>
        <div className="sb-section">Cài đặt</div>
        <div className="sb-item">
          <div className="sb-icon"><FiSettings /></div>
          <span>Cấu hình AI</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="ta-main-content">
        <header className="ta-topbar">
          <div>
            <div className="tb-title">
              {activeTab === 'at-risk' ? 'Học viên cần quan tâm' : activeTab === 'summary' ? 'Quy trình Tóm tắt buổi học' : 'Nhật ký hoạt động TA'}
            </div>
            <div className="tb-sub">
              {activeTab === 'at-risk' ? `${atRiskList.length} học viên cần hành động` : activeTab === 'summary' ? 'Tạo bản tóm tắt thông minh dựa trên tài liệu' : 'Lịch sử thao tác gần nhất'}
            </div>
          </div>
          <div className="dashboard-actions" style={{display: 'flex', gap: '8px'}}>
            <button className="ta-btn" style={{height: '38px'}} onClick={fetchData} disabled={loading}>
              <FiRefreshCw className={loading ? 'spin' : ''} /> Làm mới
            </button>
            {activeTab === 'at-risk' && (
              <button className="vibrant-btn" style={{height: '38px', padding: '0 20px', fontSize: '13px'}} onClick={handleScanAtRisk} disabled={loading}>
                <FiTrendingUp /> Quét học viên
              </button>
            )}
          </div>
        </header>

        <div className="ta-scroll-content">
          {activeTab === 'at-risk' && (
            <div className="metrics-grid animate-fade">
              <div className="metric-card">
                <div className="mc-label">Nguy cấp</div>
                <div className="mc-val" style={{color: 'var(--ta-red)'}}>{criticalCount}</div>
                <div className="mc-sub mc-dn">Cần xử lý ngay</div>
              </div>
              <div className="metric-card">
                <div className="mc-label">Cảnh báo</div>
                <div className="mc-val" style={{color: 'var(--ta-amber)'}}>{warningCount}</div>
                <div className="mc-sub">Đang theo dõi</div>
              </div>
              <div className="metric-card">
                <div className="mc-label">Tỷ lệ xử lý</div>
                <div className="mc-val">92%</div>
                <div className="mc-sub mc-up">↑ 4% tuần này</div>
              </div>
              <div className="metric-card">
                <div className="mc-label">Avg Respond</div>
                <div className="mc-val">15p</div>
                <div className="mc-sub mc-up">Tốt hơn 20%</div>
              </div>
            </div>
          )}

          {activeTab === 'at-risk' ? (
            <div className="animate-fade">
              <div className="ta-card">
                <div className="card-head">
                  <span style={{fontWeight: 600}}>🔴 Học viên có dấu hiệu rủi ro</span>
                  <span className="ta-badge badge-red">{atRiskList.length}</span>
                </div>
                {atRiskList.length === 0 ? (
                  <div className="empty-state">
                    <FiCheckCircle className="empty-icon" style={{color: 'var(--ta-accent)'}} />
                    <p>Lớp học hiện tại rất ổn định.</p>
                  </div>
                ) : (
                  atRiskList.map(student => (
                    <div key={student.id} style={{borderBottom: '1px solid var(--ta-border)'}}>
                      <div className="ta-row">
                        <img src={student.profiles?.avatar_url || 'https://ui-avatars.com/api/?name=' + (student.profiles?.display_name || 'Student')} className="student-av" alt={student.profiles?.display_name} />
                        <div className="cell-info">
                          <div className="cell-name">{student.profiles?.display_name || 'Học viên ẩn danh'}</div>
                          <div className="cell-sub">{student.reason} · {new Date(student.created_at).toLocaleTimeString('vi-VN')}</div>
                        </div>
                        <div className={`ta-badge ${student.level === 'critical' ? 'badge-red' : 'badge-amber'}`}>
                          {student.level === 'critical' ? 'Critical' : 'Warning'}
                        </div>
                        <button className="ta-btn" style={{borderColor: 'var(--ta-accent)', color: 'var(--ta-accent)'}} onClick={() => handleGetAiContext(student.id)}>
                          <FiMessageSquare /> Nhắn tin
                        </button>
                        <button className="ta-btn" onClick={() => handleResolveAlert(student.id)}>
                          <FiCheckCircle /> Đã xử lý
                        </button>
                      </div>
                      {aiContext?.id === student.id && (
                        <div style={{padding: '0 20px 16px 72px'}} className="animate-fade">
                          <div style={{background: 'var(--ta-bg3)', padding: '16px', borderRadius: '12px', border: '1px solid var(--ta-accent-bg)', display: 'flex', alignItems: 'center', gap: '12px'}}>
                            <div className="sb-icon" style={{background: 'var(--ta-accent-bg)', color: 'var(--ta-accent)', width: '32px', height: '32px'}}><FiCpu /></div>
                            <div style={{flex: 1}}>
                              <div style={{fontSize: '12px', fontWeight: 600, color: 'var(--ta-text)'}}>Đã chuẩn bị bộ Context cho học viên {student.profiles?.display_name}</div>
                              <div style={{fontSize: '11px', color: 'var(--ta-text3)', marginTop: '2px'}}>Dữ liệu đã được lưu trữ an toàn. Agent sẽ tự động lấy thông tin này để soạn tin nhắn.</div>
                            </div>
                            <button className="ta-btn" style={{fontSize: '11px'}} onClick={() => setAiContext(null)}>Đóng</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : activeTab === 'summary' ? (
            <div className="animate-fade">
              {/* Step Flow Header */}
              <div className="ta-card" style={{marginBottom: '20px'}}>
                <div style={{display: 'flex', borderBottom: '1px solid var(--ta-border)'}}>
                  {['1. Tài liệu', '2. AI Phân tích', '3. Duyệt & Đăng'].map((step, idx) => (
                    <div key={idx} style={{
                      flex: 1, padding: '16px', textAlign: 'center', fontSize: '12px', 
                      color: currentStep >= idx + 1 ? 'var(--ta-accent)' : 'var(--ta-text3)', 
                      borderBottom: currentStep === idx + 1 ? '2px solid var(--ta-accent)' : 'none', 
                      fontWeight: currentStep === idx + 1 ? 700 : 500, transition: '0.3s'
                    }}>
                      {currentStep > idx + 1 ? `✓ ${step}` : step}
                    </div>
                  ))}
                </div>
                
                <div style={{padding: '30px'}}>
                   {/* STEP 1: UPLOAD */}
                   {currentStep === 1 && (
                     <div className="animate-fade">
                        <div 
                          className="upload-zone" 
                          style={{border: '2px dashed var(--ta-border2)', background: uploadedFile ? 'var(--ta-bg-success)' : 'var(--ta-bg2)', height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}
                          onClick={() => document.getElementById('slide-upload').click()}
                        >
                           {uploading ? <FiRefreshCw className="spin" size={32} /> : 
                            uploadedFile ? <FiCheckCircle size={32} style={{color: 'var(--ta-accent)'}} /> :
                            <FiUploadCloud size={32} style={{color: 'var(--ta-accent)', marginBottom: '12px'}} />}
                           
                           <div style={{fontWeight: 600, fontSize: '15px', marginTop: '10px'}}>
                             {uploadedFile ? uploadedFile.filename : 'Tải lên Slide bài giảng (PDF, IMG)'}
                           </div>
                           <div style={{fontSize: '12px', color: 'var(--ta-text3)', marginTop: '4px'}}>
                             {uploadedFile ? `${(uploadedFile.size/1024).toFixed(1)} KB - Đã sẵn sàng` : 'Hệ thống sẽ kết hợp Slide và Chat Log để tóm tắt'}
                           </div>
                           <input type="file" style={{display: 'none'}} id="slide-upload" accept=".pdf,image/*" onChange={handleFileUpload} />
                        </div>

                        <div style={{marginTop: '30px', textAlign: 'center'}}>
                          <button 
                            className="vibrant-btn" 
                            style={{width: '240px', height: '46px', fontSize: '14px'}}
                            onClick={startAiAnalysis}
                            disabled={!uploadedFile}
                          >
                            Bắt đầu Phân tích <FiChevronRight />
                          </button>
                        </div>
                     </div>
                   )}

                   {/* STEP 2: PROCESSING */}
                   {currentStep === 2 && (
                     <div className="ai-processing-box animate-fade">
                        <div className="scan-line"></div>
                        <div className="brain-icon"><FiCpu /></div>
                        <div style={{fontWeight: 700, fontSize: '18px', color: 'var(--ta-text)', marginBottom: '8px'}}>AI ĐANG TỔNG HỢP...</div>
                        <div style={{fontSize: '13px', color: 'var(--ta-text3)', maxWidth: '400px', margin: '0 auto'}}>
                          Đang đọc tài liệu {uploadedFile?.filename} và quét nội dung thảo luận trong lớp học để soạn bản thảo tóm tắt.
                        </div>
                     </div>
                   )}

                   {/* STEP 3: PREVIEW & SCHEDULE */}
                   {currentStep === 3 && (
                     <div className="animate-fade">
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                          <div style={{fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ta-accent)'}}>
                            <FiCpu /> BẢN NHÁP TÓM TẮT THÔNG MINH
                          </div>
                          <div style={{fontSize: '11px', color: 'var(--ta-text3)'}}>Học liệu: {uploadedFile?.filename}</div>
                        </div>
                        
                        <textarea 
                          className="ta-textarea" 
                          value={aiPreview.content}
                          onChange={(e) => setAiPreview({...aiPreview, content: e.target.value})}
                          style={{width: '100%', height: '180px', background: 'var(--ta-bg)', border: '1px solid var(--ta-border)', borderRadius: '12px', padding: '16px', fontSize: '14px', color: 'var(--ta-text2)', lineHeight: 1.6, outline: 'none'}}
                        />
                        
                        <div style={{marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--ta-bg2)', padding: '20px', borderRadius: '12px', gap: '20px'}}>
                          <div style={{flex: 1}}>
                            <div style={{fontSize: '11px', fontWeight: 700, color: 'var(--ta-text3)', marginBottom: '10px', textTransform: 'uppercase'}}>Lựa chọn thời gian gửi</div>
                            <div className="time-selector" style={{width: 'fit-content'}}>
                              <div className={`time-opt ${sendTime === 'now' ? 'active' : ''}`} onClick={() => setSendTime('now')}>
                                <FiSend /> Gửi ngay
                              </div>
                              <div className={`time-opt ${sendTime === 'schedule' ? 'active' : ''}`} onClick={() => setSendTime('schedule')}>
                                <FiClock /> Hẹn giờ
                              </div>
                            </div>
                            
                            {sendTime === 'schedule' && (
                              <div className="animate-fade" style={{marginTop: '12px'}}>
                                <input 
                                  type="datetime-local" 
                                  className="ta-input" 
                                  style={{width: '200px', padding: '8px', borderRadius: '6px', border: '1px solid var(--ta-border)', background: 'var(--ta-bg)', color: 'var(--ta-text)'}}
                                  value={scheduleDate}
                                  onChange={(e) => setScheduleDate(e.target.value)}
                                />
                              </div>
                            )}
                          </div>
                          
                          <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                            <button className="ta-btn" style={{height: '42px', padding: '0 20px'}} onClick={() => setCurrentStep(1)}>
                              <FiRefreshCw /> Làm lại
                            </button>
                            <button className="vibrant-btn" style={{height: '42px', minWidth: '180px'}} onClick={handleApproveSummary}>
                              <FiCheckCircle /> {sendTime === 'now' ? 'Duyệt & Đăng bài' : 'Xác nhận đặt lịch'}
                            </button>
                          </div>
                        </div>
                     </div>
                   )}
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-fade">
              {/* Logs Tab */}
              <div className="ta-card">
                <div className="card-head"><span style={{fontWeight: 600}}>📜 Lịch sử hành động</span></div>
                {actionLogs.length === 0 ? (
                  <div className="empty-state"><p>Chưa có hành động nào.</p></div>
                ) : (
                  actionLogs.map(log => (
                    <div key={log.id} className="ta-row">
                      <div className="sb-icon" style={{background: 'var(--ta-bg4)'}}>{log.action_type === 'dismissed_alert' ? '✅' : log.action_type === 'upload_document' ? '📁' : '📝'}</div>
                      <div className="cell-info">
                        <div className="cell-name"><strong>{log.ta?.display_name || 'TA'}</strong> {log.action_type === 'dismissed_alert' ? 'đã xử lý cảnh báo cho' : log.action_type === 'upload_document' ? 'đã tải lên' : 'đã duyệt tóm tắt'}</div>
                        <div className="cell-sub">{log.notes}</div>
                      </div>
                      <div style={{fontSize: '11px', color: 'var(--ta-text3)'}}>{new Date(log.created_at).toLocaleString('vi-VN')}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TADashboard;
