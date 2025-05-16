import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Pagination,
  Skeleton,
  Tabs,
  Tab
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  LocalOffer as TagIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon
} from '@mui/icons-material';

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [savedArticles, setSavedArticles] = useState([]);
  
  const postsPerPage = 6;
  
  // Mock data for blog posts
  const blogData = [
    {
      id: 1,
      title: 'Understanding Blockchain in Healthcare: Benefits and Challenges',
      excerpt: 'Blockchain technology offers potential solutions to many healthcare challenges including data security, interoperability, and patient data ownership.',
      content: 'Full article content here...',
      author: 'Dr. Sarah Johnson',
      date: '2023-05-15',
      readTime: '8 min read',
      category: 'Technology',
      image: 'https://source.unsplash.com/random/400x200/?blockchain',
      tags: ['Blockchain', 'Healthcare Technology', 'Data Security']
    },
    {
      id: 2,
      title: 'The Impact of Medical Records Digitization on Patient Care',
      excerpt: 'Digital transformation in healthcare is revolutionizing how patient data is stored, accessed, and utilized for better care outcomes.',
      content: 'Full article content here...',
      author: 'Dr. Michael Chen',
      date: '2023-05-10',
      readTime: '6 min read',
      category: 'Digital Health',
      image: 'https://source.unsplash.com/random/400x200/?digital',
      tags: ['EHR', 'Digital Transformation', 'Patient Care']
    },
    {
      id: 3,
      title: 'New Privacy Regulations for Patient Data: What You Need to Know',
      excerpt: 'Recent regulatory changes are affecting how healthcare providers must handle, store, and secure patient information.',
      content: 'Full article content here...',
      author: 'Jennifer Williams, JD',
      date: '2023-04-28',
      readTime: '10 min read',
      category: 'Compliance',
      image: 'https://source.unsplash.com/random/400x200/?privacy',
      tags: ['HIPAA', 'Privacy', 'Compliance', 'Regulations']
    },
    {
      id: 4,
      title: 'Telemedicine Adoption Trends in Post-Pandemic Healthcare',
      excerpt: 'As we move beyond the pandemic, telemedicine continues to reshape healthcare delivery. What trends are emerging?',
      content: 'Full article content here...',
      author: 'Dr. Lisa Rodriguez',
      date: '2023-04-20',
      readTime: '7 min read',
      category: 'Telehealth',
      image: 'https://source.unsplash.com/random/400x200/?telemedicine',
      tags: ['Telemedicine', 'Remote Care', 'Healthcare Trends']
    },
    {
      id: 5,
      title: 'Healthcare App Security: Best Practices for Developers',
      excerpt: 'Developing secure healthcare applications requires specific approaches to protect sensitive patient information.',
      content: 'Full article content here...',
      author: 'Alan Parker, CISSP',
      date: '2023-04-15',
      readTime: '9 min read',
      category: 'Development',
      image: 'https://source.unsplash.com/random/400x200/?security',
      tags: ['Security', 'App Development', 'Best Practices']
    },
    {
      id: 6,
      title: 'The Role of AI in Modern Medical Diagnostics',
      excerpt: 'Artificial intelligence is transforming diagnostic capabilities, offering new tools for healthcare providers.',
      content: 'Full article content here...',
      author: 'Dr. Robert Kim',
      date: '2023-04-08',
      readTime: '8 min read',
      category: 'Technology',
      image: 'https://source.unsplash.com/random/400x200/?ai',
      tags: ['AI', 'Diagnostics', 'Machine Learning']
    },
    {
      id: 7,
      title: 'Improving Patient Engagement Through Digital Tools',
      excerpt: 'Digital engagement strategies are helping healthcare providers build stronger relationships with patients.',
      content: 'Full article content here...',
      author: 'Emma Thompson, MPH',
      date: '2023-03-30',
      readTime: '6 min read',
      category: 'Digital Health',
      image: 'https://source.unsplash.com/random/400x200/?engagement',
      tags: ['Patient Engagement', 'Digital Health', 'Patient Experience']
    },
    {
      id: 8,
      title: 'Healthcare Data Integration: Connecting Disparate Systems',
      excerpt: 'Connecting different healthcare systems remains a challenge. What approaches are showing the most promise?',
      content: 'Full article content here...',
      author: 'David Wilson, Health IT Specialist',
      date: '2023-03-22',
      readTime: '9 min read',
      category: 'Interoperability',
      image: 'https://source.unsplash.com/random/400x200/?integration',
      tags: ['Data Integration', 'Interoperability', 'Healthcare IT']
    },
    {
      id: 9,
      title: 'The Future of Electronic Health Records',
      excerpt: 'EHR systems continue to evolve. What changes can we expect in the next generation of electronic health records?',
      content: 'Full article content here...',
      author: 'Dr. Patricia Nelson',
      date: '2023-03-15',
      readTime: '7 min read',
      category: 'Digital Health',
      image: 'https://source.unsplash.com/random/400x200/?electronic',
      tags: ['EHR', 'Future Technology', 'Health Records']
    },
    {
      id: 10,
      title: 'Remote Patient Monitoring: Beyond the Basics',
      excerpt: 'Advanced remote monitoring technologies are helping providers extend care beyond traditional settings.',
      content: 'Full article content here...',
      author: 'Dr. James Martin',
      date: '2023-03-08',
      readTime: '8 min read',
      category: 'Telehealth',
      image: 'https://source.unsplash.com/random/400x200/?monitoring',
      tags: ['Remote Monitoring', 'IoT', 'Patient Care']
    },
    {
      id: 11,
      title: 'Building a Culture of Security in Healthcare Organizations',
      excerpt: 'Creating a security-focused culture is essential for protecting patient data in modern healthcare settings.',
      content: 'Full article content here...',
      author: 'Maria Garcia, Healthcare Security Consultant',
      date: '2023-03-01',
      readTime: '10 min read',
      category: 'Compliance',
      image: 'https://source.unsplash.com/random/400x200/?security-culture',
      tags: ['Security Culture', 'Training', 'Organization']
    },
    {
      id: 12,
      title: 'Blockchain Applications in Clinical Trials',
      excerpt: 'Blockchain technology is opening new possibilities for managing and conducting clinical trials.',
      content: 'Full article content here...',
      author: 'Dr. Thomas Wright',
      date: '2023-02-22',
      readTime: '9 min read',
      category: 'Technology',
      image: 'https://source.unsplash.com/random/400x200/?clinical',
      tags: ['Blockchain', 'Clinical Trials', 'Research']
    }
  ];
  
  const categories = [
    'all',
    'Technology',
    'Digital Health',
    'Compliance',
    'Telehealth',
    'Development',
    'Interoperability'
  ];
  
  useEffect(() => {
    // Simulate API call
    const fetchPosts = async () => {
      setLoading(true);
      
      // Wait for "API" response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setPosts(blogData);
      setLoading(false);
    };
    
    fetchPosts();
    
    // Retrieve saved articles from localStorage
    const saved = JSON.parse(localStorage.getItem('savedArticles')) || [];
    setSavedArticles(saved);
  }, []);
  
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset to first page when search changes
  };
  
  const clearSearch = () => {
    setSearchTerm('');
  };
  
  const handleCategoryChange = (event, newValue) => {
    setCategory(categories[newValue]);
    setPage(1); // Reset to first page when category changes
  };
  
  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const toggleSaveArticle = (id) => {
    const isSaved = savedArticles.includes(id);
    let newSavedArticles;
    
    if (isSaved) {
      newSavedArticles = savedArticles.filter(articleId => articleId !== id);
    } else {
      newSavedArticles = [...savedArticles, id];
    }
    
    setSavedArticles(newSavedArticles);
    localStorage.setItem('savedArticles', JSON.stringify(newSavedArticles));
  };
  
  // Filter posts based on search term and category
  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchTerm === '' || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = category === 'all' || post.category === category;
    
    return matchesSearch && matchesCategory;
  });
  
  // Pagination
  const indexOfLastPost = page * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  
  // Featured post - just use the first one
  const featuredPost = posts[0];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Blog & News
      </Typography>
      
      {/* Featured Article */}
      {!loading && featuredPost && (
        <Paper
          sx={{
            position: 'relative',
            backgroundColor: 'grey.800',
            color: '#fff',
            mb: 4,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundImage: `url(${featuredPost.image})`,
            height: 300,
            display: 'flex',
            alignItems: 'flex-end'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              left: 0,
              backgroundColor: 'rgba(0,0,0,.5)',
            }}
          />
          <Grid container>
            <Grid item md={8} xs={12}>
              <Box
                sx={{
                  position: 'relative',
                  p: { xs: 3, md: 6 }
                }}
              >
                <Chip label="FEATURED" color="primary" size="small" sx={{ mb: 2 }} />
                <Typography component="h1" variant="h4" color="inherit" gutterBottom>
                  {featuredPost.title}
                </Typography>
                <Typography variant="body1" color="inherit" paragraph>
                  {featuredPost.excerpt}
                </Typography>
                <Box display="flex" alignItems="center" sx={{ opacity: 0.8 }}>
                  <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" sx={{ mr: 2 }}>
                    {featuredPost.author}
                  </Typography>
                  <CalendarIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2">
                    {new Date(featuredPost.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {loading && (
        <Paper
          sx={{
            position: 'relative',
            height: 300,
            mb: 4,
          }}
        >
          <Skeleton variant="rectangular" height={300} animation="wave" />
        </Paper>
      )}
      
      {/* Search and Filter */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search articles..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton onClick={clearSearch} edge="end">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
          <Tabs
            value={categories.indexOf(category)}
            onChange={handleCategoryChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="blog categories"
          >
            {categories.map((cat, index) => (
              <Tab 
                key={index} 
                label={cat === 'all' ? 'All Categories' : cat} 
                sx={{ textTransform: 'capitalize' }}
              />
            ))}
          </Tabs>
        </Box>
      </Paper>
      
      {/* Article Grid */}
      <Box mb={4}>
        {loading ? (
          <Grid container spacing={4}>
            {[...Array(6)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Skeleton variant="rectangular" height={140} animation="wave" />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Skeleton variant="text" height={32} width="80%" animation="wave" />
                    <Skeleton variant="text" height={20} animation="wave" />
                    <Skeleton variant="text" height={20} animation="wave" />
                    <Skeleton variant="text" height={20} width="60%" animation="wave" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : filteredPosts.length > 0 ? (
          <Grid container spacing={4}>
            {currentPosts.map((post) => (
              <Grid item xs={12} sm={6} md={4} key={post.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <IconButton
                    aria-label={savedArticles.includes(post.id) ? 'Unsave article' : 'Save article'}
                    onClick={() => toggleSaveArticle(post.id)}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(255, 255, 255, 0.7)',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' }
                    }}
                  >
                    {savedArticles.includes(post.id) 
                      ? <BookmarkIcon color="primary" /> 
                      : <BookmarkBorderIcon />
                    }
                  </IconButton>
                  
                  <CardActionArea>
                    <CardMedia
                      component="img"
                      height="140"
                      image={post.image}
                      alt={post.title}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h6" component="h2">
                        {post.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {post.excerpt}
                      </Typography>
                      
                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                        <Chip 
                          icon={<TagIcon fontSize="small" />} 
                          label={post.category} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {post.readTime}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center" mt={1}>
                        <CalendarIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.875rem', color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(post.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" gutterBottom>
              No articles found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search or filters to find what you're looking for.
            </Typography>
            <Button sx={{ mt: 2 }} variant="outlined" onClick={() => {
              setSearchTerm('');
              setCategory('all');
            }}>
              Reset Filters
            </Button>
          </Box>
        )}
      </Box>
      
      {/* Pagination */}
      {!loading && filteredPosts.length > 0 && (
        <Box display="flex" justifyContent="center" mt={4} mb={2}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange} 
            color="primary" 
            showFirstButton 
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
};

export default Blog; 