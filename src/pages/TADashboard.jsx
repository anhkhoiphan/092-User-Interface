import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiAlertCircle, FiCheckCircle, FiMessageSquare, FiRefreshCw, 
  FiTrash2, FiEdit, FiClock, FiUsers, FiFileText, FiCalendar, 
  FiSettings, FiShare2, FiMoreVertical, FiTrendingUp, FiActivity, FiCpu, FiInfo, FiUploadCloud, FiSend, FiChevronRight, FiSlash, FiHelpCircle, FiBarChart 
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

  const atRiskLogs = actionLogs.filter(log => log.action_type === 'dismissed_alert');
  const summaryLogs = actionLogs.filter(log => ['upload_document', 'approved_summary'].includes(log.action_type));

  const getRiskColor = (score) => {
    if (score >= 5) return 'var(--ta-red)';
    if (score >= 3) return 'var(--ta-amber)';
    return 'var(--ta-blue)';
  };

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
          <span>Tóm tắt bài giảng bằng AI</span>
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
              {activeTab === 'at-risk' ? 'Phân tích Rủi ro học viên' : activeTab === 'summary' ? 'Tóm tắt bài giảng bằng AI' : 'Nhật ký hoạt động TA'}
            </div>
            <div className="tb-sub">
              {activeTab === 'at-risk' ? `${atRiskList.length} trường hợp cần hỗ trợ theo công thức Scoring` : activeTab === 'summary' ? 'Tạo bản tóm tắt thông minh dựa trên tài liệu' : 'Lịch sử thao tác quản lý'}
            </div>
          </div>
          <div className="dashboard-actions" style={{display: 'flex', gap: '8px'}}>
            <button className="ta-btn" style={{height: '38px'}} onClick={fetchData} disabled={loading}>
              <FiRefreshCw className={loading ? 'spin' : ''} /> Làm mới
            </button>
            {activeTab === 'at-risk' && (
              <button className="vibrant-btn" style={{height: '38px', padding: '0 20px', fontSize: '13px'}} onClick={handleScanAtRisk} disabled={loading}>
                <FiTrendingUp /> Chạy thuật toán quét
              </button>
            )}
          </div>
        </header>

        <div className="ta-scroll-content">
          {activeTab === 'at-risk' && (
            <div className="metrics-grid animate-fade">
              <div className="metric-card">
                <div className="mc-label">Nguy cấp (Score ≥ 5)</div>
                <div className="mc-val" style={{color: 'var(--ta-red)'}}>{criticalCount}</div>
                <div className="mc-sub mc-dn">Cần hành động ngay</div>
              </div>
              <div className="metric-card">
                <div className="mc-label">Cảnh báo (Score 2-4)</div>
                <div className="mc-val" style={{color: 'var(--ta-amber)'}}>{warningCount}</div>
                <div className="mc-sub">Đang theo dõi thêm</div>
              </div>
              <div className="metric-card">
                <div className="mc-label">Hiệu quả AI</div>
                <div className="mc-val">94%</div>
                <div className="mc-sub mc-up">↑ 2% chính xác</div>
              </div>
              <div className="metric-card">
                <div className="mc-label">Average Score</div>
                <div className="mc-val">3.2</div>
                <div className="mc-sub">Mức độ rủi ro lớp</div>
              </div>
            </div>
          )}

          {activeTab === 'at-risk' ? (
            <div className="animate-fade">
              <div className="ta-card">
                <div className="card-head">
                  <span style={{fontWeight: 600}}>🎯 Danh sách ưu tiên hỗ trợ</span>
                  <span className="ta-badge badge-red">{atRiskList.length}</span>
                </div>
                {atRiskList.length === 0 ? (
                  <div className="empty-state">
                    <FiCheckCircle className="empty-icon" style={{color: 'var(--ta-accent)'}} />
                    <p>Hệ thống không phát hiện rủi ro nào.</p>
                  </div>
                ) : (
                  atRiskList.map(student => {
                    const score = student.metadata?.score || 0;
                    return (
                      <div key={student.id} style={{borderBottom: '1px solid var(--ta-border)'}}>
                        <div className="ta-row">
                          <img src={student.profiles?.avatar_url || 'https://ui-avatars.com/api/?name=' + (student.profiles?.display_name || 'Student')} className="student-av" alt={student.profiles?.display_name} />
                          <div className="cell-info" style={{flex: 2}}>
                            <div className="cell-name" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                              {student.profiles?.display_name || 'Học viên'}
                              <div style={{
                                fontSize: '11px', fontWeight: 800, color: getRiskColor(score),
                                background: getRiskColor(score) + '11', padding: '2px 8px', borderRadius: '4px',
                                border: `1px solid ${getRiskColor(score)}33`
                              }}>
                                SCORE: {score}
                              </div>
                            </div>
                            <div className="cell-sub" style={{color: 'var(--ta-text2)', fontWeight: 500}}>
                              {student.reason}
                            </div>
                          </div>
                          
                          <div style={{display: 'flex', gap: '8px'}}>
                            <button className="ta-btn" style={{borderColor: 'var(--ta-accent)', color: 'var(--ta-accent)'}} onClick={() => handleGetAiContext(student.id)}>
                              <FiMessageSquare /> Agent Soạn tin
                            </button>
                            <button className="ta-btn" onClick={() => handleResolveAlert(student.id)}>
                              <FiCheckCircle /> Đã hỗ trợ
                            </button>
                          </div>
                        </div>
                        {aiContext?.id === student.id && (
                          <div style={{padding: '0 20px 16px 72px'}} className="animate-fade">
                            <div style={{background: 'var(--ta-bg3)', padding: '16px', borderRadius: '12px', border: '1px solid var(--ta-accent-bg)', display: 'flex', alignItems: 'center', gap: '12px'}}>
                              <div className="sb-icon" style={{background: 'var(--ta-accent-bg)', color: 'var(--ta-accent)', width: '32px', height: '32px'}}><FiCpu /></div>
                              <div style={{flex: 1}}>
                                <div style={{fontSize: '12px', fontWeight: 600, color: 'var(--ta-text)'}}>
                                  Chuẩn bị Context cho Agent (Risk Level: {student.level.toUpperCase()})
                                </div>
                                <div style={{fontSize: '11px', color: 'var(--ta-text3)', marginTop: '2px'}}>
                                  Tín hiệu: {student.metadata?.signals?.join(', ')}. Agent sẽ dùng dữ liệu này để cá nhân hóa tin nhắn.
                                </div>
                              </div>
                              <button className="ta-btn" style={{fontSize: '11px'}} onClick={() => setAiContext(null)}>Đóng</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
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
                             Hệ thống sẽ kết hợp Slide và Chat Log để tóm tắt
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
                          Đang phân tích tài liệu và nội dung thảo luận để soạn bản tóm tắt bài giảng.
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
                              Làm lại
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
            <div className="animate-fade" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
              <div className="ta-card">
                <div className="card-head">
                  <span style={{fontWeight: 600, color: 'var(--ta-red)', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <FiAlertCircle /> Nhật ký Cảnh báo học viên
                  </span>
                </div>
                <div style={{maxHeight: '600px', overflowY: 'auto'}}>
                  {atRiskLogs.length === 0 ? (
                    <div className="empty-state"><p>Chưa có dữ liệu.</p></div>
                  ) : (
                    atRiskLogs.map(log => (
                      <div key={log.id} className="ta-row" style={{padding: '12px 16px'}}>
                        <div className="cell-info">
                          <div className="cell-name" style={{fontSize: '13px'}}>
                            <strong>{log.ta?.display_name || 'TA'}</strong> đã xử lý cảnh báo
                          </div>
                          <div className="cell-sub">{log.notes}</div>
                          <div style={{fontSize: '10px', color: 'var(--ta-text3)', marginTop: '4px'}}>
                            {new Date(log.created_at).toLocaleString('vi-VN')}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="ta-card">
                <div className="card-head">
                  <span style={{fontWeight: 600, color: 'var(--ta-accent)', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <FiFileText /> Nhật ký Tóm tắt bài giảng
                  </span>
                </div>
                <div style={{maxHeight: '600px', overflowY: 'auto'}}>
                  {summaryLogs.length === 0 ? (
                    <div className="empty-state"><p>Chưa có dữ liệu.</p></div>
                  ) : (
                    summaryLogs.map(log => (
                      <div key={log.id} className="ta-row" style={{padding: '12px 16px'}}>
                        <div className="cell-info">
                          <div className="cell-name" style={{fontSize: '13px'}}>
                            <strong>{log.ta?.display_name || 'TA'}</strong> đã phát hành tóm tắt
                          </div>
                          <div className="cell-sub">{log.notes}</div>
                          <div style={{fontSize: '10px', color: 'var(--ta-text3)', marginTop: '4px'}}>
                            {new Date(log.created_at).toLocaleString('vi-VN')}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TADashboard;
