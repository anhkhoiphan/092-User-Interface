import React, { useState, useMemo } from 'react';
import { FiClock, FiTrash2, FiSend, FiEdit2, FiSearch, FiFilter, FiCheckSquare, FiAlertCircle } from 'react-icons/fi';

const ScheduledQueueList = ({ 
  queue = [], 
  taSpaces = [], 
  onEdit, 
  onSendNow, 
  onCancelSchedule,
  onBulkCancel,
  onBulkSendNow,
  isLoading 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [timeFilter, setTimeFilter] = useState('all'); // all, today, next7days

  // Lọc dữ liệu dựa trên search và time filter
  const filteredQueue = useMemo(() => {
    return queue.filter(item => {
      // 1. Chỉ lấy những item đang được schedule
      if (item.status !== 'scheduled' || !item.scheduled_at) return false;

      // 2. Tìm kiếm theo nội dung
      const matchesSearch = item.content?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // 3. Lọc theo thời gian
      const scheduleDate = new Date(item.scheduled_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const next7Days = new Date(today);
      next7Days.setDate(today.getDate() + 7);

      if (timeFilter === 'today') {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        return scheduleDate >= today && scheduleDate < tomorrow;
      }
      
      if (timeFilter === 'next7days') {
        return scheduleDate >= today && scheduleDate <= next7Days;
      }

      return true;
    }).sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)); // Sắp xếp gần nhất lên trước
  }, [queue, searchTerm, timeFilter]);

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredQueue.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredQueue.map(i => i.id));
    }
  };

  const getSpaceName = (spaceId) => {
    return taSpaces.find(s => s.id === spaceId)?.name || 'Lớp ẩn';
  };

  const totalScheduled = queue.filter(i => i.status === 'scheduled' && i.scheduled_at).length;

  return (
    <div className="ta-card-premium animate-fade" style={{ marginTop: '32px', marginBottom: '40px' }}>
      <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiClock color="var(--primary)" /> 
          Danh sách Đặt lịch ({totalScheduled})
        </h3>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="ta-input" 
              style={{ paddingLeft: '32px', paddingRight: '12px', paddingBottom: '6px', paddingTop: '6px', minHeight: 'auto', fontSize: '13px' }}
              placeholder="Tìm nội dung..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="modern-select" 
            style={{ padding: '6px 30px 6px 12px', fontSize: '13px' }}
            value={timeFilter}
            onChange={e => setTimeFilter(e.target.value)}
          >
            <option value="all">Tất cả thời gian</option>
            <option value="today">Hôm nay</option>
            <option value="next7days">7 ngày tới</option>
          </select>
        </div>
      </div>

      <div className="ta-card-body" style={{ padding: 0 }}>
        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div style={{ padding: '12px 24px', background: 'var(--ta-amber-bg)', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ta-amber)' }}>
              Đã chọn {selectedIds.length} bài viết
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="ta-btn" 
                style={{ borderColor: 'var(--ta-red)', color: 'var(--ta-red)', background: 'transparent' }}
                onClick={() => { onBulkCancel(selectedIds); setSelectedIds([]); }}
                disabled={isLoading}
              >
                <FiTrash2 /> Hủy lịch tất cả
              </button>
              <button 
                className="vibrant-btn" 
                style={{ padding: '6px 16px' }}
                onClick={() => { onBulkSendNow(selectedIds); setSelectedIds([]); }}
                disabled={isLoading}
              >
                <FiSend /> Gửi ngay tất cả
              </button>
            </div>
          </div>
        )}

        {/* List Header */}
        <div style={{ display: 'flex', padding: '12px 24px', borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-surface)', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          <div style={{ width: '40px' }}>
            <input 
              type="checkbox" 
              checked={filteredQueue.length > 0 && selectedIds.length === filteredQueue.length}
              onChange={handleSelectAll}
            />
          </div>
          <div style={{ flex: 1 }}>Nội dung</div>
          <div style={{ width: '150px' }}>Lớp học</div>
          <div style={{ width: '150px' }}>Giờ đăng</div>
          <div style={{ width: '120px', textAlign: 'right' }}>Thao tác</div>
        </div>

        {/* List Items */}
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {filteredQueue.length > 0 ? filteredQueue.map(item => (
            <div key={item.id} className="ta-list-row" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '40px', display: 'flex', alignItems: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={selectedIds.includes(item.id)}
                  onChange={() => handleToggleSelect(item.id)}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0, paddingRight: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  {item.draft_type === 'lesson_recap' ? 'RECAP BÀI GIẢNG' : 'THÔNG BÁO'}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.content}
                </div>
              </div>
              <div style={{ width: '150px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                {getSpaceName(item.space_id)}
              </div>
              <div style={{ width: '150px', fontSize: '13px', fontWeight: 600, color: 'var(--ta-amber)' }}>
                {new Date(item.scheduled_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
              </div>
              <div style={{ width: '120px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="ta-btn" style={{ padding: '6px' }} title="Chỉnh sửa nội dung/thời gian" onClick={() => onEdit(item)} disabled={isLoading}>
                  <FiEdit2 size={14} />
                </button>
                <button className="ta-btn" style={{ padding: '6px', color: 'var(--primary)' }} title="Bỏ qua lịch & Gửi ngay" onClick={() => onSendNow(item.id, item.space_id)} disabled={isLoading}>
                  <FiSend size={14} />
                </button>
                <button className="ta-btn" style={{ padding: '6px', color: 'var(--ta-red)' }} title="Hủy bỏ" onClick={() => onCancelSchedule(item.id, item.space_id)} disabled={isLoading}>
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          )) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FiAlertCircle size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
              <p>Không tìm thấy bài viết nào phù hợp.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduledQueueList;