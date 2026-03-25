import Feedback from '../models/Feedback.js';
import User from '../models/User.js';

export const submitFeedback = async (req, res) => {
  try {
    const { name, mobile, feedback, rating } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (!mobile || !mobile.trim()) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' });
    }
    if (!feedback || !feedback.trim()) {
      return res.status(400).json({ success: false, message: 'Feedback is required' });
    }

    // Prepare feedback data
    const feedbackData = {
      name: name.trim(),
      mobile: mobile.trim().replace(/\s/g, ''),
      feedback: feedback.trim(),
      rating: rating && rating >= 1 && rating <= 5 ? Number(rating) : null,
    };

    // If user is authenticated, add user ID and profile image
    if (req.user) {
      feedbackData.userId = req.user._id;
      
      // Get user's profile image
      const user = await User.findById(req.user._id).select('profileImage');
      if (user && user.profileImage) {
        feedbackData.profileImage = user.profileImage;
      }
    }

    const fb = await Feedback.create(feedbackData);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: { _id: fb._id },
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors)[0]?.message || 'Validation failed';
      return res.status(400).json({ success: false, message: msg });
    }
    console.error('Submit feedback error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to submit feedback' });
  }
};

export const getAllFeedback = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [feedback, total] = await Promise.all([
      Feedback.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Feedback.countDocuments()
    ]);

    const pages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      message: 'Feedback fetched successfully',
      data: {
        feedback,
        pagination: {
          page,
          pages,
          total,
          limit
        }
      }
    });
  } catch (err) {
    console.error('Get feedback error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch feedback' });
  }
};
