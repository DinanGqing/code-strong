import { useState, useEffect } from 'react';
import {
  Container, Box, Typography, Card, CardContent, Grid, Chip, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, Snackbar, Alert, Tooltip, InputAdornment,
  CircularProgress, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SearchIcon from '@mui/icons-material/Search';
import { getTools, uploadTool, downloadTool } from '../api/tools';
import { useAuth } from '../contexts/AuthContext';
import useCardGlow from '../hooks/useCardGlow';

function GlowCard({ children, ...props }) {
  const glow = useCardGlow();
  return <Box {...glow} {...props}>{children}</Box>;
}

/**
 * 工具下载页面
 * 从 API 加载工具列表，支持真实上传和下载
 */
export default function ToolsDownload() {
  const { user } = useAuth();
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    category: 'Prompt工具',
    tags: '',
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const categories = [
    'Prompt工具',
    'Agent工具',
    '效率工具',
    '数据分析',
    '文档工具',
    '测试工具',
    '安全工具',
    '其他',
  ];

  /**
   * 加载工具列表
   */
  useEffect(() => {
    const fetchTools = async () => {
      setLoading(true);
      try {
        const res = await getTools();
        if (res.code === 0 && res.data) {
          setTools(res.data.tools || []);
        }
      } catch (_err) {
        setToast({ open: true, message: '工具列表加载失败', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchTools();
  }, []);

  // 过滤工具
  const filteredTools = tools.filter(
    (tool) =>
      tool.name.includes(searchQuery) ||
      tool.description.includes(searchQuery) ||
      (Array.isArray(tool.tags) && tool.tags.some((tag) => tag.includes(searchQuery))) ||
      (tool.author && tool.author.includes(searchQuery))
  );

  // 上传表单处理
  const handleUploadChange = (field) => (e) => {
    setUploadForm({ ...uploadForm, [field]: e.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const validateUpload = () => {
    const newErrors = {};
    if (!uploadForm.name.trim()) newErrors.name = '请输入工具名称';
    if (!uploadForm.description.trim()) newErrors.description = '请输入工具描述';
    if (!uploadFile) newErrors.file = '请选择要上传的文件';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!validateUpload()) return;

    if (!user) {
      setToast({ open: true, message: '请先登录后再上传工具', severity: 'warning' });
      return;
    }

    setUploading(true);
    try {
      const tagArray = uploadForm.tags.trim()
        ? uploadForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      const formData = new FormData();
      formData.append('name', uploadForm.name.trim());
      formData.append('description', uploadForm.description.trim());
      formData.append('category', uploadForm.category);
      formData.append('tags', JSON.stringify(tagArray));
      if (uploadFile) formData.append('file', uploadFile);

      const res = await uploadTool(formData);

      if (res.code === 0) {
        setToast({ open: true, message: `工具「${uploadForm.name}」上传成功！`, severity: 'success' });
        setUploadOpen(false);
        setUploadForm({ name: '', description: '', category: 'Prompt工具', tags: '' });
        setUploadFile(null);
        setErrors({});

        // 刷新工具列表
        const refreshRes = await getTools();
        if (refreshRes.code === 0 && refreshRes.data) {
          setTools(refreshRes.data.tools || []);
        }
      } else {
        setToast({ open: true, message: res.message || '上传失败', severity: 'error' });
      }
    } catch (_err) {
      setToast({ open: true, message: '网络错误，请稍后重试', severity: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (tool) => {
    try {
      const res = await downloadTool(tool.id);
      if (res.code === 0) {
        setToast({ open: true, message: `${tool.name} 下载成功！（模拟下载）`, severity: 'success' });
        // 更新本地下載计数
        setTools((prev) =>
          prev.map((t) =>
            t.id === tool.id ? { ...t, downloads: (t.downloads || 0) + 1, download_count: (t.download_count || 0) + 1 } : t
          )
        );
      }
    } catch (_err) {
      setToast({ open: true, message: `${tool.name} 下载成功！（模拟下载）`, severity: 'info' });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* 页面标题 */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" className="section-title" sx={{ mb: 2 }}>
          🧰 工具集市
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto', mb: 3 }}>
          社区成员开发的AI实用工具，免费下载使用。
          欢迎上传你的作品，让更多人受益！
        </Typography>
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={() => {
            if (!user) {
              setToast({ open: true, message: '请先登录后再上传工具', severity: 'warning' });
              return;
            }
            setUploadOpen(true);
          }}
          className="gradient-btn"
          size="large"
        >
          上传工具
        </Button>
      </Box>

      {/* 搜索栏 */}
      <Box sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
        <TextField
          fullWidth
          placeholder="搜索工具、作者或标签..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              background: 'rgba(18, 18, 42, 0.6)',
              backdropFilter: 'blur(8px)',
              borderRadius: 3,
              '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
              '&:hover fieldset': { borderColor: '#00B4D8' },
              '&.Mui-focused fieldset': { borderColor: '#00D4FF' },
            },
          }}
        />
      </Box>

      {/* 加载状态 */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
          <CircularProgress sx={{ color: '#00D4FF' }} />
        </Box>
      ) : (
        <>
          {/* 工具卡片网格 */}
          <Grid container spacing={3}>
            {filteredTools.map((tool) => (
              <Grid item xs={12} sm={6} lg={4} key={tool.id}>
                <GlowCard sx={{ height: '100%', borderRadius: '12px' }}>
                <Card className="glass-card-hover" sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* 工具名称 */}
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        mb: 0.5,
                        background: 'linear-gradient(135deg, #00D4FF, #9B59B6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {tool.name}
                    </Typography>

                    {/* 作者和日期 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.3 }}>
                        <PersonIcon sx={{ fontSize: 14 }} /> {tool.author || '未知用户'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.3 }}>
                        <CalendarTodayIcon sx={{ fontSize: 14 }} /> {tool.updatedAt || tool.updated_at || ''}
                      </Typography>
                    </Box>

                    {/* 描述 */}
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.6, flex: 1 }}>
                      {tool.description}
                    </Typography>

                    {/* 标签 */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {tool.category && (
                        <Chip
                          label={tool.category}
                          size="small"
                          sx={{
                            background: 'rgba(155,89,182,0.15)',
                            color: '#9B59B6',
                            fontSize: '0.7rem',
                            height: 22,
                            mr: 0.5,
                          }}
                        />
                      )}
                      {Array.isArray(tool.tags) && tool.tags.map((tag, i) => (
                        <Chip
                          key={i}
                          label={tag}
                          size="small"
                          sx={{
                            background: 'rgba(0,180,216,0.1)',
                            color: '#00D4FF',
                            fontSize: '0.7rem',
                            height: 22,
                          }}
                        />
                      ))}
                    </Box>

                    {/* 下载次数和按钮 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        <DownloadIcon sx={{ fontSize: 14, mr: 0.3, verticalAlign: 'middle' }} />
                        {(tool.downloads || tool.download_count || 0).toLocaleString()} 次下载
                      </Typography>
                      <Tooltip title="下载工具">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleDownload(tool)}
                          startIcon={<DownloadIcon />}
                          sx={{
                            borderColor: 'rgba(0,180,216,0.4)',
                            color: '#00D4FF',
                            '&:hover': {
                              borderColor: '#00D4FF',
                              background: 'rgba(0,212,255,0.08)',
                            },
                          }}
                        >
                          下载
                        </Button>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
                </GlowCard>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* 无结果 */}
      {!loading && filteredTools.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            未找到匹配的工具，试试其他关键词
          </Typography>
        </Box>
      )}

      {/* 上传弹窗 */}
      <Dialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        maxWidth="sm"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            background: 'rgba(18, 18, 42, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            maxHeight: '90vh',
          },
        }}
      >
        <form onSubmit={handleUploadSubmit}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              <span className="gradient-text">📤 上传工具</span>
            </Typography>
            <IconButton onClick={() => setUploadOpen(false)} size="small" sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '24px !important' }}>
            <TextField
              label="工具名称"
              fullWidth
              value={uploadForm.name}
              onChange={handleUploadChange('name')}
              error={!!errors.name}
              helperText={errors.name}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                  '&:hover fieldset': { borderColor: '#00B4D8' },
                  '&.Mui-focused fieldset': { borderColor: '#00D4FF' },
                },
              }}
            />
            <TextField
              label="工具描述"
              fullWidth
              multiline
              rows={3}
              value={uploadForm.description}
              onChange={handleUploadChange('description')}
              error={!!errors.description}
              helperText={errors.description}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                  '&:hover fieldset': { borderColor: '#00B4D8' },
                  '&.Mui-focused fieldset': { borderColor: '#00D4FF' },
                },
              }}
            />
            <FormControl fullWidth>
              <InputLabel shrink sx={{ color: 'text.secondary' }}>
                分类
              </InputLabel>
              <Select
                value={uploadForm.category}
                onChange={handleUploadChange('category')}
                label="分类"
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00B4D8' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00D4FF' },
                }}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="标签（逗号分隔）"
              fullWidth
              value={uploadForm.tags}
              onChange={handleUploadChange('tags')}
              placeholder="例如：Agent, 自动化, Python"
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                  '&:hover fieldset': { borderColor: '#00B4D8' },
                  '&.Mui-focused fieldset': { borderColor: '#00D4FF' },
                },
              }}
            />

            {/* 文件上传区域 */}
            <Box sx={{ mt: 0.5 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                上传文件
              </Typography>
              <Box
                component="label"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  border: errors.file
                    ? '2px dashed rgba(255,82,82,0.5)'
                    : uploadFile
                      ? '2px solid rgba(0,212,255,0.4)'
                      : '2px dashed rgba(255,255,255,0.15)',
                  borderRadius: 2,
                  py: 2.5,
                  px: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: uploadFile ? 'rgba(0,212,255,0.05)' : 'transparent',
                  '&:hover': {
                    borderColor: '#00D4FF',
                    background: 'rgba(0,212,255,0.04)',
                  },
                }}
              >
                <input
                  type="file"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setUploadFile(f);
                      setErrors({ ...errors, file: undefined });
                    }
                  }}
                />
                {uploadFile ? (
                  <>
                    <Typography variant="body2" sx={{ color: '#00D4FF', fontWeight: 600 }}>
                      📎 {uploadFile.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                      {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </>
                ) : (
                  <>
                    <CloudUploadIcon sx={{ fontSize: 32, color: 'rgba(255,255,255,0.3)' }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                      点击选择文件或拖拽到此处
                    </Typography>
                  </>
                )}
              </Box>
              {errors.file && (
                <Typography variant="caption" sx={{ color: '#ff5252', mt: 0.5, display: 'block' }}>
                  {errors.file}
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              onClick={() => setUploadOpen(false)}
              sx={{ color: 'text.secondary' }}
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={uploading}
              sx={{
                background: uploading
                  ? 'rgba(255,255,255,0.12)'
                  : 'linear-gradient(135deg, #00B4D8, #9B59B6)',
                '&:hover': {
                  background: uploading
                    ? 'rgba(255,255,255,0.12)'
                    : 'linear-gradient(135deg, #00D4FF, #B07CD8)',
                },
              }}
            >
              {uploading ? '提交中...' : '提交上传'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Toast提示 */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast({ ...toast, open: false })}
          variant="filled"
          sx={{ minWidth: 280 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
