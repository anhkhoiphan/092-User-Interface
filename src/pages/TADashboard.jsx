import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiAlertCircle, FiCheckCircle, FiRefreshCw, 
  FiFileText, FiActivity, FiSettings, FiTrendingUp, FiSend, FiChevronRight, FiBarChart,
  FiCpu, FiClock, FiTrash2, FiInfo, FiLayers, FiCheckSquare, FiFilter, FiEdit3, FiMessageSquare
} from 'react-icons/fi';
import taService from '../services/ta.service';

// New TA Components
import RiskCard from '../components/ta/RiskCard';
import RecapWorkflow from '../components/ta/RecapWorkflow';
import AnnouncementWorkflow from '../components/ta/AnnouncementWorkflow';
import AiComposeModal from '../components/ta/AiComposeModal';

import './TADashboard.css';

const TADashboard = () => {
  const { spaces = [] } = useSelector((state) => state.space || {});
  const { user } = useSelector((state) => state.auth || {});
  
  const taSpaces = useSelector(state => {
    const allSpaces = state.space.spaces || [];
    return allSpaces.filter(s => s.owner_id === user?.id || s.role === 'owner' || s.role === 'admin');
  });
  
  const [atRiskList, setAtRiskList] = useState([]);
  const [summaryQueue, setSummaryQueue] = useState([]);
  const [actionLogs, setActionLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('at-risk');
  const [selectedSpaceFilter, setSelectedSpaceFilter] = useState('all');
  
  // AI Flow State
  const [currentStep, setCurrentStep] = useState(1); 
  const [aiPreview, setAiPreview] = useState(null);
  const [sendTime, setSendTime] = useState('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);

  // AI Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [currentContext, setCurrentContext] = useState(null);
  
  // Settings State
  const [aiSettings, setAiSettings] = useState({
    absenceThreshold: 72,
    sensitivity: 'Vừa',
    persona: 'pro',
    autoScan: true,
    telegramNotif: false,
    approvalMode: true
  });

  const [lastFetchTime, setLastFetchTime] = useState(Date.now());
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    if (taSpaces.length === 0) return;
    setLoading(true);
    try {
      const allAtRisk = [];
      const allQueue = [];
      const allLogs = [];

      await Promise.all(taSpaces.map(async (space) => {
        // Tự động quét rủi ro mỗi khi tải dữ liệu
        try { await taService.scanAtRisk(space.id); } catch (e) {}

        const [atRiskRes, queueRes, logsRes] = await Promise.allSettled([
          taService.getAtRiskList(space.id),
          taService.getSummaryQueue(space.id),
          taService.getActionLogs(space.id)
        ]);

        if (atRiskRes.status === 'fulfilled') {
          const data = (atRiskRes.value.data || []).map(s => ({ ...s, space_id: space.id }));
          allAtRisk.push(...data);
        }
        if (queueRes.status === 'fulfilled') {
          const data = (queueRes.value.data || []).map(q => ({ ...q, space_id: space.id }));
          allQueue.push(...data);
        }
        if (logsRes.status === 'fulfilled') {
          allLogs.push(...(logsRes.value.data || []));
        }
      }));

      setAtRiskList(allAtRisk);
      setSummaryQueue(allQueue);
      setActionLogs(allLogs);
      setLastFetchTime(Date.now());
    } catch (error) {
      console.error('Failed to fetch TA Dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const [processedSnapshots, setProcessedSnapshots] = useState(() => {
    return JSON.parse(localStorage.getItem('ta_processed_snapshots') || '[]');
  });

  // Logic phân loại và lọc Alert thông minh theo đặc tả rút gọn
  const getCategorizedAlerts = () => {
    const filtered = atRiskList.filter(item => {
      // Ẩn nếu đã xử lý trong phiên này hoặc đã resolved trong DB
      if (processedSnapshots.includes(item.id)) return false;
      if (item.is_resolved) return false;
      // Filter theo lớp học nếu có chọn lọc
      if (selectedSpaceFilter !== 'all' && item.space_id !== selectedSpaceFilter) return false;
      return true;
    });

    return filtered.map(item => {
      const score = item.metadata?.score || 0;
      const signals = item.metadata?.signals || [];
      const signalsCount = signals.length;

      let displayLevel = 'warning';
      let color = 'var(--ta-warning)';

      if (score >= 7 || (score >= 5 && signalsCount >= 2)) {
        displayLevel = 'critical';
        color = 'var(--ta-critical)';
      } else if (score >= 5) {
        displayLevel = 'high';
        color = 'var(--ta-high)';
      }

      return { ...item, displayLevel, color };
    }).sort((a, b) => (b.metadata?.score || 0) - (a.metadata?.score || 0));
  };

  const markAsProcessed = (snapshotId) => {
    const processedIds = JSON.parse(localStorage.getItem('ta_processed_snapshots') || '[]');
    if (!processedIds.includes(snapshotId)) {
      processedIds.push(snapshotId);
      localStorage.setItem('ta_processed_snapshots', JSON.stringify(processedIds));
    }
    // Update local state to trigger re-render
    setAtRiskList(prev => prev.filter(item => item.id !== snapshotId));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [spaces.length]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (selectedSpaceFilter === 'all') {
      alert('⚠️ Vui lòng chọn một lớp học cụ thể trước khi tải lên tài liệu.');
      return;
    }
    
    setUploading(true);
    try {
      const res = await taService.uploadSlide(selectedSpaceFilter, file);
      if (res.success) {
        setUploadedFile({ ...res.data, rawFile: file });
      } else {
        alert('❌ Tải lên thất bại.');
      }
    } catch (error) {
      alert('❌ Lỗi kết nối server.');
    } finally {
      setUploading(false);
    }
  };

  const startAiAnalysis = async () => {
    if (selectedSpaceFilter === 'all') {
      alert('⚠️ Vui lòng chọn một lớp học cụ thể để AI có thể phân tích dữ liệu.');
      return;
    }

    setCurrentStep(2);
    try {
      let agentResponse;
      const senderId = user?.display_name || user?.id || 'TA';
      const query = `Hãy đóng vai một Trợ giảng (TA) nhiệt huyết và chuyên nghiệp. Dựa trên nội dung buổi học, hãy soạn một bản Recap gửi cho các bạn học viên với cấu trúc sau:
1. Lời chào: Thân thiện, truyền cảm hứng (VD: 'Chào các bạn, buổi học hôm nay thực sự bùng nổ!').
2. Tóm tắt nội dung chính: Chia thành 3-5 ý chính rõ ràng, mỗi ý có tiêu đề đậm và mô tả súc tích.
3. Các quyết định/Lưu ý quan trọng: Điểm lại những gì học viên cần chốt hoặc nhớ kỹ.
4. Bài tập & Deadline: Liệt kê rõ ràng những việc cần hoàn thành.
5. Lời kết: Động viên và nhắc nhở các bạn.

Giọng văn: Chuyên nghiệp nhưng gần gũi, sử dụng các từ như 'chúng mình', 'các bạn'. 
Yêu cầu: Định dạng Markdown đẹp mắt, sử dụng emoji phù hợp để tăng tính sinh động.`;

      if (uploadedFile && uploadedFile.rawFile) {
        // Phân tích từ File PDF/Ảnh bài giảng
        agentResponse = await taService.callAgentWithFile(
          selectedSpaceFilter,
          query,
          senderId,
          uploadedFile.rawFile
        );
      } else {
        // Tóm tắt từ hội thoại trong phòng chat
        agentResponse = await taService.callAgentChat(
          selectedSpaceFilter,
          query,
          senderId
        );
      }
      console.log('[DEBUG] Agent Response:', agentResponse);
      if (agentResponse && agentResponse.answer) {
        // Lưu bản thảo vào DB sau khi Agent trả về kết quả
        const res = await taService.createSummaryDraft({
          spaceId: selectedSpaceFilter,
          content: agentResponse.answer,
          metadata: { 
            processing_time: agentResponse.processing_time,
            source: uploadedFile ? 'multimedia' : 'conversation',
            created_by: user?.id
          },
          draft_type: 'lesson_recap'
        });

        if (res.success) {
          setAiPreview(res.data);
          setCurrentStep(3);
        } else {
          alert('❌ Không thể lưu bản thảo Recap.');
          setCurrentStep(1);
        }
      } else {
        throw new Error('Agent returned invalid response');
      }
    } catch (error) {
      console.error('AI Analysis failed:', error);
      alert('❌ Lỗi phân tích từ AI Agent: ' + (error.message || 'Dịch vụ không phản hồi'));
      setCurrentStep(1);
    }
  };

  const handleGenerateAnnouncement = async (purpose, context) => {
    if (selectedSpaceFilter === 'all') {
      alert('⚠️ Vui lòng chọn một lớp học cụ thể ở thanh bộ lọc phía trên trước khi tạo thông báo!');
      return;
    }
    setUploading(true);
    try {
      const senderId = user?.display_name || user?.id || 'TA';
      const query = `Hãy đóng vai một Trợ giảng chuyên nghiệp. Soạn một thông báo gửi tới lớp học.
Mục đích: ${purpose}
Ngữ cảnh cụ thể: ${context || 'Chưa có thông tin chi tiết'}

Yêu cầu:
- Phong cách: Gần gũi, khích lệ nhưng vẫn trang trọng.
- Định dạng: Markdown (dùng Bold, Bullet points để dễ đọc).
- Sử dụng Emoji phù hợp.
- Độ dài: Súc tích, tập trung vào thông tin cần truyền tải.`;

      const agentResponse = await taService.callAgentChat(selectedSpaceFilter, query, senderId);
      
      if (agentResponse && agentResponse.answer) {
        const res = await taService.createSummaryDraft({
          spaceId: selectedSpaceFilter,
          content: agentResponse.answer,
          metadata: { purpose, context, created_by: user?.id, processing_time: agentResponse.processing_time },
          draft_type: 'announcement'
        });

        if (res.success) {
          setAiPreview(res.data);
          // Cập nhật hàng đợi hiển thị
          setSummaryQueue([res.data, ...summaryQueue]);
        }
      }
    } catch (error) {
      console.error('Announcement generation failed:', error);
      alert('❌ Không thể tạo thông báo bằng AI: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleResolveAlert = async (id, spaceId) => {
    try {
      await taService.resolveAlert(id, spaceId);
      markAsProcessed(id); // Ẩn ngay lập tức khỏi Dashboard
    } catch (error) {
      console.error('Resolve failed:', error);
    }
  };

  const handleApproveSummary = async (draftId, spaceId) => {
    try {
      // 1. Cập nhật nội dung bản thảo lên server trước (để lưu những gì TA đã sửa như 'ABC')
      if (aiPreview && aiPreview.id === draftId) {
        await taService.updateSummaryDraft(draftId, spaceId, {
          content: aiPreview.content,
          metadata: aiPreview.metadata
        });
      }

      // 2. Sau đó mới gọi phê duyệt để đăng bài
      await taService.approveSummary(draftId, spaceId);
      alert('✅ Bản tóm tắt đã được phê duyệt và đăng bài thành công!');
      fetchData();
      if (currentStep === 3) {
        setCurrentStep(1);
        setAiPreview(null);
        setUploadedFile(null);
      }
    } catch (error) {
      console.error('Approval failed:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Lỗi không xác định';
      alert(`❌ Lỗi khi phê duyệt bản tóm tắt: ${errorMsg}`);
    }
  };
  
  const handleScheduleSummary = async (draftId, spaceId, scheduledAt) => {
    console.log('[DEBUG] Scheduling summary:', { draftId, spaceId, scheduledAt });
    if (!draftId || !spaceId || !scheduledAt) {
      alert(`⚠️ Thiếu thông tin đặt lịch: ${!draftId ? 'ID bản thảo, ' : ''}${!spaceId ? 'ID lớp học, ' : ''}${!scheduledAt ? 'Thời gian' : ''}`);
      return;
    }
    try {
      // 1. Lưu nội dung mới nhất (ví dụ 'ABC') trước khi đặt lịch
      if (aiPreview && aiPreview.id === draftId) {
        await taService.updateSummaryDraft(draftId, spaceId, {
          content: aiPreview.content,
          metadata: aiPreview.metadata
        });
      }

      // 2. Chuyển đổi sang ISO String để tránh lệch múi giờ khi lưu vào DB
      const isoDate = new Date(scheduledAt).toISOString();
      await taService.scheduleSummary(draftId, spaceId, isoDate);
      alert(`📅 Đã đặt lịch gửi bản tóm tắt vào: ${new Date(scheduledAt).toLocaleString()}`);
      fetchData();
      if (currentStep === 3) {
        setCurrentStep(1);
        setAiPreview(null);
        setUploadedFile(null);
      }
    } catch (error) {
      console.error('Scheduling failed:', error);
      alert('❌ Lỗi khi đặt lịch gửi.');
    }
  };

  const handleCancelSchedule = async (draftId) => {
    try {
      // Tìm không gian của bản thảo để truyền spaceId (vì API của tôi yêu cầu spaceId để check quyền)
      const draft = summaryQueue.find(q => q.id === draftId);
      if (!draft) return;

      await taService.cancelSchedule(draftId, draft.space_id);
      alert('✅ Đã hủy đặt lịch gửi.');
      fetchData();
    } catch (error) {
      console.error('Cancel schedule failed:', error);
      alert('❌ Lỗi khi hủy đặt lịch.');
    }
  };

  const handleOpenCompose = async (snapshotId, spaceId) => {
    console.log(`[TA-DASHBOARD] Khởi tạo context cho Agent: snapshotId=${snapshotId}, spaceId=${spaceId}`);
    try {
      setLoading(true);
      const res = await taService.getAtRiskContext(snapshotId, spaceId);
      
      if (res && res.data) {
        console.log('[TA-DASHBOARD] Đã lưu context thành công:', res.data);
        setCurrentContext({ id: snapshotId, spaceId, ...res.data });
      } else {
        // Mock data nếu API trả về rỗng để tránh màn hình trắng
        console.warn('[TA-DASHBOARD] API context trả về rỗng, đang sử dụng dữ liệu giả lập.');
        const student = atRiskList.find(s => s.id === snapshotId);
        setCurrentContext({
          id: snapshotId,
          spaceId,
          student_info: { name: student?.profiles?.display_name || 'Học viên' },
          at_risk_data: { 
            level: student?.level || 'warning',
            score: student?.metadata?.score || 2,
            signals: Array.isArray(student?.metadata?.signals) ? student.metadata.signals : ['Vắng mặt lâu ngày'],
            last_msg: student?.metadata?.last_msg
          }
        });
      }
      setIsComposeOpen(true);
    } catch (error) {
      console.error('[TA-DASHBOARD] Lỗi khi lấy context:', error);
      // Fallback để Modal vẫn mở được với dữ liệu tối thiểu
      const student = atRiskList.find(s => s.id === snapshotId);
      setCurrentContext({
        id: snapshotId,
        spaceId,
        student_info: { name: student?.profiles?.display_name || 'Học viên' },
        at_risk_data: { 
          level: 'warning', 
          score: 2,
          signals: ['Mất kết nối API (Sử dụng dữ liệu tạm thời)'] 
        }
      });
      setIsComposeOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAiSend = async (message) => {
    if (!currentContext) return;
    
    try {
      setLoading(true);
      await taService.sendSmartMessage(currentContext.at_risk_data?.space_id || selectedSpaceFilter, {
        studentId: currentContext.student_info?.id,
        content: message,
        snapshotId: currentContext.id
      });
      
      markAsProcessed(currentContext.id); // Ẩn ngay sau khi gửi tin nhắn hỗ trợ thành công
      alert(`🤖 Tin nhắn AI đã được gửi thành công đến học viên!`);
      setIsComposeOpen(false);
    } catch (error) {
      console.error('Failed to send smart message:', error);
      alert('❌ Lỗi khi gửi tin nhắn AI: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const formatOfflineTime = (student) => {
    console.log(`[DEBUG] Formatting Offline Time for ${student.profiles?.display_name}:`, student);
    const lastSeenStr = student.last_seen || student.metadata?.last_seen || student.profiles?.last_seen;
    
    let diffMs = 0;
    if (lastSeenStr) {
      const lastDate = new Date(lastSeenStr);
      diffMs = new Date() - lastDate;
    } else if (student.hours_since_active) {
      // Fallback dùng số giờ từ backend
      diffMs = student.hours_since_active * 3600000;
    } else {
      return 'N/A';
    }

    if (diffMs < 0) return 'Vừa mới';
    
    const diffHours = diffMs / (1000 * 60 * 60);
    const d = Math.floor(diffHours / 24);
    const h = Math.floor(diffHours % 24);
    const m = Math.floor((diffMs / (1000 * 60)) % 60);
    const s = Math.floor((diffMs / 1000) % 60);
    
    if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  const getRiskColor = (score) => {
    if (score >= 5) return 'var(--ta-red)';
    if (score >= 2) return 'var(--ta-amber)';
    return 'var(--ta-green)';
  };

  const getHomeworkBadge = (status) => {
    switch(status) {
      case 'submitted': return <span className="ta-badge" style={{background: 'var(--ta-bg-success)', color: 'var(--ta-green)'}}>Đã nộp</span>;
      case 'late': return <span className="ta-badge" style={{background: 'var(--ta-red-bg)', color: 'var(--ta-red)'}}>Nộp muộn</span>;
      default: return null;
    }
  };

  const filteredAtRisk = selectedSpaceFilter === 'all' ? atRiskList : atRiskList.filter(s => s.space_id === selectedSpaceFilter);
  const filteredQueue = selectedSpaceFilter === 'all' ? summaryQueue : summaryQueue.filter(q => q.space_id === selectedSpaceFilter);

  const criticalCount = atRiskList.filter(s => s.level === 'critical').length;
  const warningCount = atRiskList.filter(s => s.level === 'warning').length;
  const pendingRecaps = summaryQueue.filter(q => q.status === 'scheduled' && q.draft_type === 'lesson_recap').length;
  const sentRecaps = summaryQueue.filter(q => q.status === 'approved' && q.draft_type === 'lesson_recap').length;
  const pendingAnnouncements = summaryQueue.filter(q => q.status === 'scheduled' && q.draft_type === 'announcement').length;
  const sentAnnouncements = summaryQueue.filter(q => q.status === 'approved' && q.draft_type === 'announcement').length;
  
  const resolvedAlerts = actionLogs.filter(l => l.action_type === 'dismissed_alert').length;
  
  // Tab-specific ROI calculations
  const atRiskSaved = ((atRiskList.length * 0.3) + (resolvedAlerts * 0.2)).toFixed(1);
  const recapSaved = ((sentRecaps + pendingRecaps) * 1.5).toFixed(1);
  const announcementSaved = ((sentAnnouncements + pendingAnnouncements) * 0.5).toFixed(1);

  if (taSpaces.length === 0 && !loading) {
    return (
      <div className="ta-dashboard-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
        <div style={{textAlign: 'center', color: 'var(--ta-text3)'}}>
          <FiAlertCircle size={48} style={{marginBottom: '16px', opacity: 0.5}} />
          <h2>Trung tâm Quản lý TA</h2>
          <p>Bạn hiện chưa quản lý lớp học nào.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ta-dashboard-container">
      <AiComposeModal 
        isOpen={isComposeOpen} 
        onClose={() => setIsComposeOpen(false)} 
        context={currentContext} 
        onSend={handleAiSend} 
        isSending={loading}
      />

      <aside className="ta-internal-sidebar">
        <div className="sb-head">
          <div className="sb-title">TA Dashboard v3</div>
          <div className="sb-sub">{taSpaces.length} Lớp đang quản lý</div>
        </div>
        <div className="sb-section">Giám sát</div>
        <div className={`sb-item ${activeTab === 'at-risk' ? 'active' : ''}`} onClick={() => setActiveTab('at-risk')}>
          <div className="sb-icon" style={{background: 'var(--ta-red-bg)', color: 'var(--ta-red)'}}><FiAlertCircle /></div>
          <span>At-Risk Alert</span>
          {atRiskList.length > 0 && <span className="ta-badge badge-red" style={{marginLeft: 'auto'}}>{atRiskList.length}</span>}
        </div>
        <div className={`sb-item ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
          <div className="sb-icon" style={{background: 'rgba(124, 58, 237, 0.1)', color: 'var(--ta-accent)'}}><FiFileText /></div>
          <span>Recap AI Hub</span>
          {summaryQueue.filter(q => q.status === 'scheduled' && q.draft_type === 'lesson_recap').length > 0 && (
            <span className="ta-badge" style={{marginLeft: 'auto', background: 'var(--ta-accent)', color: 'white'}}>
              {summaryQueue.filter(q => q.status === 'scheduled' && q.draft_type === 'lesson_recap').length}
            </span>
          )}
        </div>
        <div className={`sb-item ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
          <div className="sb-icon" style={{background: 'rgba(59, 130, 246, 0.1)', color: 'var(--ta-blue)'}}><FiActivity /></div>
          <span>Nhật ký hoạt động</span>
        </div>
        <div className={`sb-item ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => setActiveTab('announcements')}>
          <div className="sb-icon" style={{background: 'rgba(245, 158, 11, 0.1)', color: 'var(--ta-amber)'}}><FiMessageSquare /></div>
          <span>Thông báo AI</span>
          {summaryQueue.filter(q => q.status === 'scheduled' && q.draft_type === 'announcement').length > 0 && (
            <span className="ta-badge" style={{marginLeft: 'auto', background: 'var(--ta-amber)', color: 'white'}}>
              {summaryQueue.filter(q => q.status === 'scheduled' && q.draft_type === 'announcement').length}
            </span>
          )}
        </div>
        <div className="sb-section">Hệ thống</div>
        <div className={`sb-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <div className="sb-icon" style={{background: 'rgba(156, 163, 175, 0.1)', color: 'var(--ta-text3)'}}><FiSettings /></div>
          <span>Cấu hình Intelligence</span>
        </div>
      </aside>

      <div className="ta-main-content">
        <header className="ta-header">
          <div className="ta-title-area">
             <h1>{activeTab === 'at-risk' ? 'Giám sát Rủi ro' : activeTab === 'summary' ? 'Recap AI Hub' : activeTab === 'announcements' ? 'Thông báo AI' : activeTab === 'logs' ? 'Nhật ký hoạt động' : 'Cấu hình'}</h1>
             <p>{taSpaces.length} Lớp đang quản lý</p>
          </div>
          
          <button className="ta-btn" onClick={fetchData} disabled={loading} title="Làm mới dữ liệu">
            <FiRefreshCw className={loading ? 'spin' : ''} />
          </button>
        </header>

        <div className="ta-scroll-content">
          {/* Global Space Selector within content */}
          {(activeTab === 'at-risk' || activeTab === 'summary' || activeTab === 'announcements') && (
            <div className="space-selector-container">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FiLayers color="var(--ta-text3)" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ta-text2)', textTransform: 'uppercase', letterSpacing: '1px' }}>Chọn lớp học:</span>
              </div>
              <select 
                className="ta-select-premium"
                value={selectedSpaceFilter}
                onChange={(e) => setSelectedSpaceFilter(e.target.value)}
              >
                <option value="all">Tất cả các lớp học</option>
                {taSpaces.map(space => (
                  <option key={space.id} value={space.id}>{space.name}</option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'at-risk' && (
            <div className="animate-fade">
              <div className="metrics-grid" style={{ marginBottom: '30px' }}>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--ta-red)' }}>
                  <div className="stat-label">Cấp bách (Critical)</div>
                  <div className="stat-val" style={{ color: 'var(--ta-red)' }}>{criticalCount}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ta-text3)' }}>Cần can thiệp ngay lập tức</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--ta-amber)' }}>
                  <div className="stat-label">Cảnh báo (Warning)</div>
                  <div className="stat-val" style={{ color: 'var(--ta-amber)' }}>{warningCount}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ta-text3)' }}>Học viên có dấu hiệu vắng mặt</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--ta-green)' }}>
                  <div className="stat-label">Số ca đã xử lý</div>
                  <div className="stat-val" style={{ color: 'var(--ta-green)' }}>{resolvedAlerts}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ta-text3)' }}>Hoàn thành hỗ trợ học viên</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--ta-purple)' }}>
                  <div className="stat-label">Thời gian tiết kiệm</div>
                  <div className="stat-val" style={{ color: 'var(--ta-purple)' }}>{atRiskSaved}h</div>
                  <div style={{ fontSize: '11px', color: 'var(--ta-text3)' }}>ROI từ giám sát & soạn tin</div>
                </div>
              </div>

              <div className="ta-card-premium" style={{ marginBottom: '30px' }}>
                <div className="card-head" style={{ borderBottom: '1px solid var(--ta-border)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--ta-red)' }}></div>
                    <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '1px' }}>GIÁM SÁT HỌC VIÊN RỦI RO</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div className="ta-badge" style={{ background: 'var(--ta-red-bg)', color: 'var(--ta-red)', fontSize: '10px' }}>CRITICAL: {criticalCount}</div>
                    <div className="ta-badge" style={{ background: 'var(--ta-amber-bg)', color: 'var(--ta-amber)', fontSize: '10px' }}>WARNING: {warningCount}</div>
                  </div>
                </div>
                <div className="ta-card-body" style={{ padding: 0 }}>
                  {getCategorizedAlerts().length === 0 ? (
                    <div className="empty-state" style={{ padding: '60px 0' }}>
                      <FiCheckCircle size={48} color="var(--ta-accent)" style={{ marginBottom: '16px', opacity: 0.5 }} />
                      <h3>Mọi thứ đang trong tầm kiểm soát</h3>
                      <p style={{ color: 'var(--ta-text3)' }}>Tất cả học viên đều đang tương tác ổn định.</p>
                    </div>
                  ) : (
                    getCategorizedAlerts().map(student => (
                      <RiskCard 
                        key={student.id} 
                        student={student} 
                        spaceName={taSpaces.find(s => s.id === student.space_id)?.name}
                        onResolve={handleResolveAlert}
                        onGetContext={handleOpenCompose}
                        formatOfflineTime={formatOfflineTime}
                        getRiskColor={() => student.color}
                        getHomeworkBadge={getHomeworkBadge}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="animate-fade">
              <div className="metrics-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--ta-green)' }}>
                  <div className="stat-label">Bản Recap đã gửi</div>
                  <div className="stat-val" style={{ color: 'var(--ta-green)' }}>{sentRecaps}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ta-text3)' }}>Đã đăng lên phòng Tóm tắt</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--ta-amber)' }}>
                  <div className="stat-label">Bản Recap chờ đăng</div>
                  <div className="stat-val" style={{ color: 'var(--ta-amber)' }}>{pendingRecaps}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ta-text3)' }}>Trong hàng đợi đặt lịch</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--ta-blue)' }}>
                  <div className="stat-label">Độ tin cậy AI</div>
                  <div className="stat-val" style={{ color: 'var(--ta-blue)' }}>94%</div>
                  <div style={{ fontSize: '11px', color: 'var(--ta-text3)' }}>Độ chính xác từ Slide & Chat</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--ta-purple)' }}>
                  <div className="stat-label">Thời gian tiết kiệm</div>
                  <div className="stat-val" style={{ color: 'var(--ta-purple)' }}>{recapSaved}h</div>
                  <div style={{ fontSize: '11px', color: 'var(--ta-text3)' }}>ROI từ việc tóm tắt tự động</div>
                </div>
              </div>

              {/* Main Workflow - TOP */}
              <div style={{ position: 'relative', marginBottom: '30px' }}>
                <div className="tool-header-badge">
                  CÔNG CỤ TẠO RECAP MỚI
                </div>
                <RecapWorkflow 
                  currentStep={currentStep}
                  uploading={uploading}
                  uploadedFile={uploadedFile}
                  handleFileUpload={handleFileUpload}
                  startAiAnalysis={startAiAnalysis}
                  aiPreview={aiPreview}
                  sendTime={sendTime}
                  setSendTime={setSendTime}
                  scheduleDate={scheduleDate}
                  setScheduleDate={setScheduleDate}
                  handleApproveSummary={handleApproveSummary}
                  setCurrentStep={setCurrentStep}
                  setAiPreview={setAiPreview}
                  handleScheduleSummary={handleScheduleSummary}
                />
              </div>

              {/* Scheduled Queue - BOTTOM */}
              {summaryQueue.filter(q => q.status === 'scheduled' && q.draft_type === 'lesson_recap' && (selectedSpaceFilter === 'all' || q.space_id === selectedSpaceFilter)).length > 0 && (
                <div className="ta-card-premium" style={{ marginTop: '30px' }}>
                  <div className="card-head" style={{ padding: '18px 24px', borderBottom: '1px solid var(--ta-border)', color: 'var(--ta-blue)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FiClock /> QUẢN LÝ HÀNG ĐỢI ĐẶT LỊCH
                  </div>
                  <div className="scheduled-list">
                    {summaryQueue.filter(q => q.status === 'scheduled' && q.draft_type === 'lesson_recap' && (selectedSpaceFilter === 'all' || q.space_id === selectedSpaceFilter)).map(item => (
                      <div key={item.id} className="ta-list-row">
                         <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ta-text)' }}>{item.draft_type === 'lesson_recap' ? 'Tóm tắt bài giảng' : 'Bản tin lớp học'}</div>
                            <div style={{ fontSize: '12px', color: 'var(--ta-text3)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                               <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiLayers size={13} /> {taSpaces.find(s => s.id === item.space_id)?.name}</span>
                               <span style={{ color: 'var(--ta-blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                 <FiClock size={13} /> 
                                 Dự kiến gửi: {new Date(item.scheduled_at).toLocaleString('vi-VN')}
                               </span>
                            </div>
                         </div>
                         <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="ta-btn" style={{ background: 'var(--ta-bg3)', border: '1px solid var(--ta-border)' }} onClick={() => {
                              setAiPreview(item);
                              setCurrentStep(3);
                            }}>
                              <FiEdit3 style={{ marginRight: '6px' }} /> Xem lại
                            </button>
                            <button className="ta-btn" style={{ background: 'var(--ta-red-bg)', color: 'var(--ta-red)', border: '1px solid var(--ta-red)33' }} onClick={() => handleCancelSchedule(item.id)} title="Hủy đặt lịch">
                              <FiTrash2 />
                            </button>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="animate-fade">
              <div className="metrics-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--ta-green)' }}>
                  <div className="stat-label">Thông báo đã gửi</div>
                  <div className="stat-val" style={{ color: 'var(--ta-green)' }}>{sentAnnouncements}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ta-text3)' }}>Đã đăng lên phòng Thông báo</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--ta-amber)' }}>
                  <div className="stat-label">Thông báo chờ gửi</div>
                  <div className="stat-val" style={{ color: 'var(--ta-amber)' }}>{pendingAnnouncements}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ta-text3)' }}>Đang trong hàng đợi</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--ta-blue)' }}>
                  <div className="stat-label">Tỷ lệ tương tác</div>
                  <div className="stat-val" style={{ color: 'var(--ta-blue)' }}>88%</div>
                  <div style={{ fontSize: '11px', color: 'var(--ta-text3)' }}>Học viên đã xem thông báo</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--ta-purple)' }}>
                  <div className="stat-label">Thời gian tiết kiệm</div>
                  <div className="stat-val" style={{ color: 'var(--ta-purple)' }}>{announcementSaved}h</div>
                  <div style={{ fontSize: '11px', color: 'var(--ta-text3)' }}>ROI từ thông báo tự động</div>
                </div>
              </div>

              <div style={{ position: 'relative', marginBottom: '30px' }}>
                <div className="tool-header-badge" style={{ background: 'linear-gradient(135deg, var(--ta-amber), #d97706)' }}>
                  CÔNG CỤ TẠO THÔNG BÁO AI
                </div>
                <AnnouncementWorkflow 
                  onGenerate={handleGenerateAnnouncement}
                  loading={uploading}
                  aiPreview={aiPreview}
                  setAiPreview={setAiPreview}
                  handleApprove={handleApproveSummary}
                  handleSchedule={handleScheduleSummary}
                  sendTime={sendTime}
                  setSendTime={setSendTime}
                  scheduleDate={scheduleDate}
                  setScheduleDate={setScheduleDate}
                />
              </div>

              {/* Announcement Queue - BOTTOM */}
              {summaryQueue.filter(q => q.status === 'scheduled' && q.draft_type === 'announcement' && (selectedSpaceFilter === 'all' || q.space_id === selectedSpaceFilter)).length > 0 && (
                <div className="ta-card-premium" style={{ marginTop: '30px' }}>
                  <div className="card-head" style={{ padding: '18px 24px', borderBottom: '1px solid var(--ta-border)', color: 'var(--ta-amber)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FiClock /> THÔNG BÁO ĐANG CHỜ GỬI
                  </div>
                  <div className="scheduled-list">
                    {summaryQueue.filter(q => q.status === 'scheduled' && q.draft_type === 'announcement' && (selectedSpaceFilter === 'all' || q.space_id === selectedSpaceFilter)).map(item => (
                      <div key={item.id} className="ta-list-row">
                         <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ta-text)' }}>Thông báo: {item.metadata?.purpose || 'Chung'}</div>
                            <div style={{ fontSize: '12px', color: 'var(--ta-text3)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                               <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiLayers size={13} /> {taSpaces.find(s => s.id === item.space_id)?.name}</span>
                               <span style={{ color: 'var(--ta-amber)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                 <FiClock size={13} /> 
                                 Dự kiến gửi: {new Date(item.scheduled_at).toLocaleString('vi-VN')}
                               </span>
                            </div>
                         </div>
                         <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="ta-btn" style={{ background: 'var(--ta-bg3)', border: '1px solid var(--ta-border)' }} onClick={() => {
                              setAiPreview(item);
                              setActiveTab('announcements');
                            }}>
                              <FiEdit3 style={{ marginRight: '6px' }} /> Xem/Sửa
                            </button>
                            <button className="ta-btn" style={{ background: 'var(--ta-red-bg)', color: 'var(--ta-red)', border: '1px solid var(--ta-red)33' }} onClick={() => handleCancelSchedule(item.id)}>
                              <FiTrash2 />
                            </button>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-fade">
              <div className="ta-card-premium" style={{ padding: '40px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--ta-accent-bg)', color: 'var(--ta-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiSettings size={20} />
                  </div>
                  <span style={{ fontSize: '20px', fontWeight: 800 }}>Cấu hình Intelligence Hub</span>
                </h2>
                
                <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px' }}>
                  <div className="setting-group">
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ta-accent)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '24px' }}>HỆ THỐNG GIÁM SÁT RỦI RO</div>
                    <div className="setting-control" style={{ marginBottom: '30px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <label style={{ fontWeight: 700, fontSize: '14px' }}>Ngưỡng vắng mặt (Offline)</label>
                        <span style={{ fontSize: '14px', color: 'var(--ta-accent)', fontWeight: 800 }}>{aiSettings.absenceThreshold} Giờ</span>
                      </div>
                      <input type="range" min="24" max="168" step="12" value={aiSettings.absenceThreshold} onChange={e => setAiSettings({...aiSettings, absenceThreshold: e.target.value})} style={{ width: '100%', accentColor: 'var(--ta-accent)', height: '6px', borderRadius: '3px' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', color: 'var(--ta-text3)' }}>
                        <span>24h</span>
                        <span>72h (Mặc định)</span>
                        <span>168h</span>
                      </div>
                    </div>
                    <div className="setting-control">
                      <label style={{ display: 'block', fontWeight: 700, marginBottom: '12px', fontSize: '14px' }}>Độ nhạy phân tích AI</label>
                      <div style={{ 
                        display: 'flex', 
                        gap: '4px', 
                        background: 'var(--ta-bg3)', 
                        padding: '4px', 
                        borderRadius: '12px',
                        border: '1px solid var(--ta-border)'
                      }}>
                        {['Thấp', 'Vừa', 'Cao'].map(s => (
                          <button key={s} 
                            className={`filter-btn ${aiSettings.sensitivity === s ? 'active' : ''}`} 
                            style={{ flex: 1, borderRadius: '8px', padding: '8px 0' }} 
                            onClick={() => setAiSettings({...aiSettings, sensitivity: s})}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
 
                  <div className="setting-group">
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ta-accent)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '24px' }}>TỰ ĐỘNG HÓA & PHÊ DUYỆT</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {[
                        { id: 'autoScan', label: 'Tự động quét hàng ngày', desc: 'AI tự động tìm kiếm rủi ro vào 8:00 sáng' },
                        { id: 'approvalMode', label: 'Chế độ phê duyệt thủ công', desc: 'Tất cả tin nhắn do AI soạn thảo cần có TA duyệt' }
                      ].map(opt => (
                        <div key={opt.id} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '16px',
                          background: 'var(--ta-bg3)',
                          borderRadius: '16px',
                          border: '1px solid var(--ta-border)'
                        }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '14px' }}>{opt.label}</div>
                            <div style={{ fontSize: '12px', color: 'var(--ta-text3)', marginTop: '2px' }}>{opt.desc}</div>
                          </div>
                          <div style={{ position: 'relative', width: '40px', height: '22px' }}>
                            <input 
                              type="checkbox" 
                              style={{ width: '100%', height: '100%', cursor: 'pointer', opacity: 1 }}
                              checked={aiSettings[opt.id]} 
                              onChange={() => setAiSettings({...aiSettings, [opt.id]: !aiSettings[opt.id]})} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
 
                <div style={{ marginTop: '50px', paddingTop: '30px', borderTop: '1px solid var(--ta-border)', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                   <button className="ta-btn" style={{ background: 'transparent', border: '1px solid var(--ta-border)' }}>Khôi phục mặc định</button>
                   <button className="vibrant-btn" onClick={() => alert('Cấu hình đã được lưu!')}>Lưu cấu hình hệ thống</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="animate-fade">
              <div className="ta-card-premium">
                <div className="card-head" style={{ padding: '20px 24px', borderBottom: '1px solid var(--ta-border)', fontWeight: 800, fontSize: '13px', letterSpacing: '1px' }}>
                  LỊCH SỬ HOẠT ĐỘNG HỆ THỐNG
                </div>
                <div className="logs-list">
                   {actionLogs.length === 0 ? (
                     <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--ta-text3)' }}>
                        <FiActivity size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                        <p>Chưa ghi nhận hoạt động nào</p>
                     </div>
                   ) : (
                     actionLogs.map(log => (
                       <div key={log.id} className="ta-list-row">
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '12px', 
                            background: log.action_type?.includes('alert') || log.action_type?.includes('dismissed') ? 'rgba(239, 68, 68, 0.08)' : 'rgba(124, 58, 237, 0.08)',
                            color: log.action_type?.includes('alert') || log.action_type?.includes('dismissed') ? 'var(--ta-red)' : 'var(--ta-accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                             {log.action_type?.includes('alert') || log.action_type?.includes('dismissed') ? <FiCheckCircle size={18} /> : <FiFileText size={18} />}
                          </div>
                          <div style={{ flex: 1 }}>
                             <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ta-text)' }}>{log.notes}</div>
                             <div style={{ fontSize: '12px', color: 'var(--ta-text3)', marginTop: '2px' }}>Thực hiện bởi: <span style={{ color: 'var(--ta-text2)', fontWeight: 600 }}>{log.ta?.display_name || 'Hệ thống'}</span></div>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--ta-text3)', background: 'var(--ta-bg3)', padding: '4px 12px', borderRadius: '8px', border: '1px solid var(--ta-border)' }}>
                            {new Date(log.created_at).toLocaleString('vi-VN')}
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
