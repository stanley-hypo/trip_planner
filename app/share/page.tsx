'use client';

import { useEffect, useState } from 'react';
import { AppShell, Container, Title, Text, Card, Stack, Group, Button, Textarea, Badge, Divider, ActionIcon, Tooltip, Modal, TextInput, Select, HoverCard } from '@mantine/core';
import { IconPlus, IconMessage, IconHeart, IconExternalLink, IconCopy, IconCheck, IconEye, IconMessageCircle, IconShare, IconEdit, IconTrash, IconDeviceFloppy, IconX, IconSend, IconUser } from '@tabler/icons-react';
import { Navigation } from '../../components/Navigation';
import useSWR from 'swr';
import { Trip } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(async (r) => {
  if (!r.ok) throw new Error((await r.json()).error || 'Request failed');
  return r.json();
});

interface TravelPost {
  id: string;
  title: string;
  author: string;
  content: string;
  trip?: Trip;
  category: string;
  timestamp: string;
  likes: number;
  comments: Comment[];
  views: number;
  tags: string[];
}

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
}

export default function SharePage() {
  const { data, error, isLoading } = useSWR<{ ok: boolean; trip: Trip }>(`/api/trip`, fetcher);
  const { data: sharingData, error: sharingError, isLoading: sharingLoading, mutate: mutatePosts } = useSWR<{ ok: boolean; posts: TravelPost[] }>(`/api/sharing`, fetcher);
  const trip = data?.trip;
  const [posts, setPosts] = useState<TravelPost[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: '其他',
    tags: ''
  });
  
  // 用戶身份管理
  const [currentUser, setCurrentUser] = useState<string>('');
  const [showCommentModal, setShowCommentModal] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  
  // Cookies管理
  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };
  
  const setCookie = (name: string, value: string, days: number = 30) => {
    if (typeof document === 'undefined') return;
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  };
  
  // 載入分享數據
  useEffect(() => {
    if (sharingData?.posts) {
      setPosts(sharingData.posts);
    }
  }, [sharingData]);

  // 初始化當前用戶
  useEffect(() => {
    const savedUser = getCookie('selectedUser');
    if (savedUser && trip?.meta.participants.includes(savedUser)) {
      setCurrentUser(savedUser);
    } else if (trip?.meta.participants && trip.meta.participants.length > 0) {
      setCurrentUser(trip.meta.participants[0]);
    }
  }, [trip]);

  // 保存數據到服務器
  const savePosts = async (newPosts: TravelPost[]) => {
    try {
      await fetch('/api/sharing', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ posts: newPosts }) 
      });
      await mutatePosts(); // 重新獲取數據
    } catch (error) {
      console.error('Error saving posts:', error);
    }
  };

  const addPost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    
    const post: TravelPost = {
      id: Date.now().toString(),
      title: newPost.title.trim(),
      author: currentUser || '匿名',
      content: newPost.content.trim(),
      trip: trip,
      category: newPost.category,
      timestamp: new Date().toLocaleString('zh-TW'),
      likes: 0,
      comments: [],
      views: 1,
      tags: newPost.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    };
    
    const newPosts = [post, ...posts];
    setPosts(newPosts);
    await savePosts(newPosts);
    setNewPost({ title: '', content: '', category: '其他', tags: '' });
    setShowModal(false);
  };

  const deletePost = async (id: string) => {
    if (window.confirm('確定要刪除這篇分享嗎？')) {
      const newPosts = posts.filter(p => p.id !== id);
      setPosts(newPosts);
      await savePosts(newPosts);
    }
  };

  const startEditPost = (post: TravelPost) => {
    setEditingPost(post.id);
    setNewPost({
      title: post.title,
      content: post.content,
      category: post.category,
      tags: post.tags.join(', ')
    });
    setShowModal(true);
  };

  const saveEditPost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim() || !editingPost) return;
    
    const newPosts = posts.map(p => 
      p.id === editingPost 
        ? {
            ...p,
            title: newPost.title.trim(),
            content: newPost.content.trim(),
            category: newPost.category,
            tags: newPost.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            timestamp: new Date().toLocaleString('zh-TW') + ' (已編輯)'
          }
        : p
    );
    
    setPosts(newPosts);
    await savePosts(newPosts);
    setNewPost({ title: '', content: '', category: '其他', tags: '' });
    setEditingPost(null);
    setShowModal(false);
  };

  const cancelEdit = () => {
    setEditingPost(null);
    setNewPost({ title: '', content: '', category: '其他', tags: '' });
    setShowModal(false);
  };

  const addComment = async (postId: string) => {
    if (!newComment.trim() || !currentUser) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      author: currentUser,
      content: newComment.trim(),
      timestamp: new Date().toLocaleString('zh-TW'),
      likes: 0
    };
    
    const newPosts = posts.map(p => 
      p.id === postId 
        ? { ...p, comments: [...p.comments, comment] }
        : p
    );
    
    setPosts(newPosts);
    await savePosts(newPosts);
    setNewComment('');
    setShowCommentModal(null);
  };

  const likeComment = async (postId: string, commentId: string) => {
    const newPosts = posts.map(p => 
      p.id === postId 
        ? {
            ...p, 
            comments: p.comments.map(c => 
              c.id === commentId ? { ...c, likes: c.likes + 1 } : c
            )
          }
        : p
    );
    
    setPosts(newPosts);
    await savePosts(newPosts);
  };

  const handleUserChange = (newUser: string) => {
    setCurrentUser(newUser);
    setCookie('selectedUser', newUser);
  };

  const likePost = async (id: string) => {
    const newPosts = posts.map(p => 
      p.id === id ? { ...p, likes: p.likes + 1 } : p
    );
    
    setPosts(newPosts);
    await savePosts(newPosts);
  };

  const incrementViews = async (id: string) => {
    const newPosts = posts.map(p => 
      p.id === id ? { ...p, views: p.views + 1 } : p
    );
    
    setPosts(newPosts);
    await savePosts(newPosts);
  };

  const categories = [
    { value: '日本', label: '🇯🇵 日本' },
    { value: '韓國', label: '🇰🇷 韓國' },
    { value: '台灣', label: '🇹🇼 台灣' },
    { value: '東南亞', label: '🌴 東南亞' },
    { value: '歐洲', label: '🏰 歐洲' },
    { value: '美國', label: '🇺🇸 美國' },
    { value: '其他', label: '🌍 其他' }
  ];

  if (isLoading || sharingLoading) {
    return (
      <AppShell header={{ height: 60 }} padding="md">
        <Navigation />
        <AppShell.Main>
          <Container size="md" py="xl">
            <Text>載入中...</Text>
          </Container>
        </AppShell.Main>
      </AppShell>
    );
  }

  // 即使沒有個人行程也可以瀏覽討論區

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <Navigation />
      <AppShell.Main>
        <Container size="lg" py="xl">
          <Stack gap="xl">
            
            {/* 討論區標題和發布按鈕 */}
            <Group justify="space-between" align="center">
              <Stack gap="xs">
                <Title order={2}>🌍 旅行分享討論區</Title>
                <Text c="dimmed">分享你的旅行經驗，參考他人的行程安排</Text>
              </Stack>
              
              <Group gap="md">
                {/* 用戶選擇器 */}
                <Group gap="xs">
                  <IconUser size={16} />
                  <Select
                    data={trip?.meta.participants.map(p => ({ value: p, label: p })) || []}
                    value={currentUser}
                    onChange={(value) => value && handleUserChange(value)}
                    placeholder="選擇身份"
                    size="sm"
                    w={120}
                  />
                </Group>
                
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={() => setShowModal(true)}
                  size="md"
                  disabled={!currentUser}
                >
                  發布行程
                </Button>
              </Group>
            </Group>

            {/* 旅行分享文章列表 */}
            <Stack gap="md">
              {posts.length === 0 ? (
                <Card padding="xl" radius="md" withBorder style={{ textAlign: 'center' }}>
                  <Stack gap="md" align="center">
                    <Text size="xl">🌟</Text>
                    <Text size="lg" fw={500}>還沒有任何分享</Text>
                    <Text c="dimmed">成為第一個分享旅行經驗的人吧！</Text>
                    <Button 
                      leftSection={<IconPlus size={16} />}
                      onClick={() => setShowModal(true)}
                      disabled={!currentUser}
                    >
                      立即分享
                    </Button>
                  </Stack>
                </Card>
              ) : (
                posts.map((post) => (
                  <Card key={post.id} padding="lg" radius="md" withBorder>
                    <Stack gap="md">
                      {/* 文章標題和分類 */}
                      <Group justify="space-between" align="flex-start">
                        <Stack gap="xs" style={{ flex: 1 }}>
                          <Group gap="xs">
                            <Badge variant="light" color="blue">{post.category}</Badge>
                            {post.tags.map((tag) => (
                              <Badge key={tag} variant="outline" size="xs">{tag}</Badge>
                            ))}
                          </Group>
                          <Title order={4}>{post.title}</Title>
                          <Group gap="xs" justify="space-between" align="center">
                            <Group gap="xs">
                              <Text size="sm" c="dimmed">👤 {post.author}</Text>
                              
                              {/* 日期顯示 - hover顯示行程詳情 */}
                              {post.trip ? (
                                <HoverCard width={400} shadow="md" withinPortal>
                                  <HoverCard.Target>
                                    <Text size="sm" c="dimmed" style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}>
                                      📅 {post.timestamp}
                                    </Text>
                                  </HoverCard.Target>
                                  <HoverCard.Dropdown>
                                    <Stack gap="xs">
                                      <Group justify="space-between">
                                        <Text size="sm" fw={500}>📋 附帶行程安排</Text>
                                        <Badge variant="light" size="xs">
                                          {post.trip.meta.startDate} → {post.trip.meta.endDate}
                                        </Badge>
                                      </Group>
                                      <Text size="xs" c="dimmed">
                                        共 {post.trip.days.length} 天行程 · 參與成員：{post.trip.meta.participants.join('、')}
                                      </Text>
                                      <Divider />
                                      
                                      {/* 顯示前3天的行程概要 */}
                                      <Stack gap={4}>
                                        {post.trip.days.slice(0, 3).map((day: any) => (
                                          <Group key={day.date} gap="xs" wrap="nowrap">
                                            <Text size="xs" fw={500} c="blue" style={{ minWidth: '80px' }}>
                                              {day.date.slice(5)} {day.weekday.slice(2)}
                                            </Text>
                                            <Stack gap={2} style={{ flex: 1 }}>
                                              {day.lunch?.booking?.place && (
                                                <Text size="xs" c="orange">🍽️ {day.lunch.booking.place}</Text>
                                              )}
                                              {day.dinner?.booking?.place && (
                                                <Text size="xs" c="violet">🍷 {day.dinner.booking.place}</Text>
                                              )}
                                              {day.specialEvents?.length > 0 && (
                                                <Text size="xs" c="green">🎯 {day.specialEvents[0].title}</Text>
                                              )}
                                              {!day.lunch?.booking?.place && !day.dinner?.booking?.place && !day.specialEvents?.length && (
                                                <Text size="xs" c="dimmed">無特別安排</Text>
                                              )}
                                            </Stack>
                                          </Group>
                                        ))}
                                        {post.trip.days.length > 3 && (
                                          <Text size="xs" c="dimmed" ta="center">
                                            ... 還有 {post.trip.days.length - 3} 天行程
                                          </Text>
                                        )}
                                      </Stack>
                                    </Stack>
                                  </HoverCard.Dropdown>
                                </HoverCard>
                              ) : (
                                <Text size="sm" c="dimmed">📅 {post.timestamp}</Text>
                              )}
                            </Group>
                            
                            {/* 編輯和刪除按鈕（只對當前用戶發布的文章顯示） */}
                            {post.author === currentUser && (
                              <Group gap="xs">
                                <ActionIcon
                                  variant="light"
                                  color="blue"
                                  onClick={() => startEditPost(post)}
                                >
                                  <IconEdit size={16} />
                                </ActionIcon>
                                <ActionIcon
                                  variant="light"
                                  color="red"
                                  onClick={() => deletePost(post.id)}
                                >
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </Group>
                            )}
                          </Group>
                        </Stack>
                      </Group>
                      
                      {/* 文章內容 */}
                      <Text>{post.content}</Text>
                      
                      {/* 互動按鈕 */}
                    <Group justify="space-between">
                      <Group gap="lg">
                        <Group gap="xs">
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => likePost(post.id)}
                          >
                            <IconHeart size={16} />
                          </ActionIcon>
                          <Text size="sm">{post.likes}</Text>
                        </Group>
                        
                        <Group gap="xs">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => setShowCommentModal(post.id)}
                          >
                            <IconMessageCircle size={16} />
                          </ActionIcon>
                          <Text size="sm">{post.comments.length}</Text>
                        </Group>
                        
                        <Group gap="xs">
                          <ActionIcon
                            variant="light"
                            color="gray"
                            onClick={() => incrementViews(post.id)}
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                          <Text size="sm">{post.views}</Text>
                        </Group>
                      </Group>
                      

                    </Group>
                    
                    {/* 評論區 */}
                    {post.comments.length > 0 && (
                      <Card padding="sm" withBorder style={{ backgroundColor: '#f8f9fa', marginTop: '12px' }}>
                        <Stack gap="xs">
                          <Text size="sm" fw={500} c="dimmed">💬 評論 ({post.comments.length})</Text>
                          {post.comments.slice(0, 3).map((comment) => (
                            <Group key={comment.id} justify="space-between" align="flex-start">
                              <Stack gap={4} style={{ flex: 1 }}>
                                <Group gap="xs">
                                  <Text size="sm" fw={500}>{comment.author}</Text>
                                  <Text size="xs" c="dimmed">{comment.timestamp}</Text>
                                </Group>
                                <Text size="sm">{comment.content}</Text>
                              </Stack>
                              <Group gap="xs" align="center">
                                <ActionIcon
                                  size="xs"
                                  variant="light"
                                  color="red"
                                  onClick={() => likeComment(post.id, comment.id)}
                                >
                                  <IconHeart size={12} />
                                </ActionIcon>
                                <Text size="xs">{comment.likes}</Text>
                              </Group>
                            </Group>
                          ))}
                          {post.comments.length > 3 && (
                            <Text size="xs" c="dimmed">還有 {post.comments.length - 3} 條評論...</Text>
                          )}
                          <Button 
                            size="xs" 
                            variant="subtle" 
                            onClick={() => setShowCommentModal(post.id)}
                          >
                            查看全部評論 / 留言
                          </Button>
                        </Stack>
                      </Card>
                    )}
                  </Stack>
                </Card>
                ))
              )}
            </Stack>

            {/* 發布行程模態框 */}
            <Modal
              opened={showModal}
              onClose={editingPost ? cancelEdit : () => setShowModal(false)}
              title={editingPost ? "✏️ 編輯旅行分享" : "📝 發布旅行分享"}
              size="lg"
            >
              <Stack gap="md">
                {/* 顯示當前發佈身份 */}
                <Card padding="sm" withBorder style={{ backgroundColor: '#e7f5ff' }}>
                  <Group gap="xs">
                    <IconUser size={16} />
                    <Text size="sm" fw={500}>發佈身份：{currentUser}</Text>
                    <Select
                      data={trip?.meta.participants.map(p => ({ value: p, label: p })) || []}
                      value={currentUser}
                      onChange={(value) => value && handleUserChange(value)}
                      size="xs"
                      w={100}
                    />
                  </Group>
                </Card>
                
                <TextInput
                  label="標題"
                  placeholder="例如：日本北海道滑雪美食之旅 5日4夜"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.currentTarget.value })}
                />
                
                <Group grow>
                  <Select
                    label="旅行地區"
                    data={categories}
                    value={newPost.category}
                    onChange={(value) => setNewPost({ ...newPost, category: value || '其他' })}
                  />
                  <TextInput
                    label="標籤"
                    placeholder="用逗號分隔，例如：滑雪,美食,溫泉"
                    value={newPost.tags}
                    onChange={(e) => setNewPost({ ...newPost, tags: e.currentTarget.value })}
                  />
                </Group>
                
                <Textarea
                  label="分享內容"
                  placeholder="分享你的旅行經驗、推薦景點、美食心得等..."
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.currentTarget.value })}
                  minRows={5}
                  autosize
                />
                
                {trip && !editingPost && (
                  <Card padding="sm" withBorder style={{ backgroundColor: '#f0f8ff' }}>
                    <Group justify="space-between">
                      <Text size="sm" fw={500}>📋 將附帶你當前的行程安排</Text>
                      <Text size="xs" c="dimmed">
                        {trip.meta.startDate} → {trip.meta.endDate} ({trip.days.length} 天)
                      </Text>
                    </Group>
                  </Card>
                )}
                
                {editingPost && (
                  <Card padding="sm" withBorder style={{ backgroundColor: '#fff8e1' }}>
                    <Text size="sm" fw={500} c="orange">⚠️ 編輯模式：修改現有的分享內容</Text>
                  </Card>
                )}
                
                <Group justify="flex-end" mt="md">
                  <Button 
                    variant="light" 
                    leftSection={<IconX size={16} />}
                    onClick={editingPost ? cancelEdit : () => setShowModal(false)}
                  >
                    取消
                  </Button>
                  <Button
                    leftSection={<IconDeviceFloppy size={16} />}
                    onClick={editingPost ? saveEditPost : addPost}
                    disabled={!newPost.title.trim() || !newPost.content.trim()}
                  >
                    {editingPost ? '儲存修改' : '發布分享'}
                  </Button>
                </Group>
              </Stack>
            </Modal>

            {/* 評論模態框 */}
            <Modal
              opened={!!showCommentModal}
              onClose={() => {
                setShowCommentModal(null);
                setNewComment('');
              }}
              title="💬 評論與回覆"
              size="lg"
            >
              {showCommentModal && (() => {
                const post = posts.find(p => p.id === showCommentModal);
                if (!post) return null;
                
                return (
                  <Stack gap="md">
                    {/* 文章摘要 */}
                    <Card padding="sm" withBorder style={{ backgroundColor: '#f8f9fa' }}>
                      <Stack gap="xs">
                        <Text size="sm" fw={500} truncate>{post.title}</Text>
                        <Text size="xs" c="dimmed">👤 {post.author} · 📅 {post.timestamp}</Text>
                      </Stack>
                    </Card>
                    
                    {/* 現有評論列表 */}
                    <Stack gap="md" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {post.comments.length > 0 ? (
                        post.comments.map((comment) => (
                          <Card key={comment.id} padding="sm" withBorder>
                            <Group justify="space-between" align="flex-start">
                              <Stack gap={4} style={{ flex: 1 }}>
                                <Group gap="xs">
                                  <Text size="sm" fw={500}>{comment.author}</Text>
                                  <Text size="xs" c="dimmed">{comment.timestamp}</Text>
                                </Group>
                                <Text size="sm">{comment.content}</Text>
                              </Stack>
                              <Group gap="xs" align="center">
                                <ActionIcon
                                  size="sm"
                                  variant="light"
                                  color="red"
                                  onClick={() => likeComment(post.id, comment.id)}
                                >
                                  <IconHeart size={14} />
                                </ActionIcon>
                                <Text size="sm">{comment.likes}</Text>
                              </Group>
                            </Group>
                          </Card>
                        ))
                      ) : (
                        <Text c="dimmed" ta="center" py="md">還沒有評論，快來搶沙發！</Text>
                      )}
                    </Stack>
                    
                    {/* 新增評論 */}
                    <Divider label="發表評論" />
                    <Stack gap="md">
                      {/* 評論身份選擇 */}
                      <Group gap="xs">
                        <IconUser size={16} />
                        <Text size="sm">評論身份：</Text>
                        <Select
                          data={trip?.meta.participants.map(p => ({ value: p, label: p })) || []}
                          value={currentUser}
                          onChange={(value) => value && handleUserChange(value)}
                          size="sm"
                          w={120}
                        />
                      </Group>
                      
                      <Textarea
                        placeholder="寫下你的評論..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.currentTarget.value)}
                        minRows={3}
                        autosize
                      />
                      
                      <Group justify="flex-end">
                        <Button
                          leftSection={<IconSend size={16} />}
                          onClick={() => addComment(post.id)}
                          disabled={!newComment.trim() || !currentUser}
                        >
                          發送評論
                        </Button>
                      </Group>
                    </Stack>
                  </Stack>
                );
              })()}
            </Modal>

          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
