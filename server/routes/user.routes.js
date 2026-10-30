import express from 'express';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Tournament from '../models/Tournament.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only) with team affiliation and tournament registrations
// @access  Private/Admin
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('suspendedBy', 'username email')
      .populate('team', 'name leader')
      .lean();

    const userIds = users.map((u) => u._id);
    const teamIds = users
      .filter((u) => u.team && u.team._id)
      .map((u) => u.team._id);

    // Fetch tournaments to map user participation
    const tournaments = await Tournament.find({
      $or: [
        { 'registeredPlayers.player': { $in: userIds } },
        { 'registeredTeams.team': { $in: teamIds } },
      ],
    })
      .select('name startDate endDate status format registeredPlayers registeredTeams')
      .lean();

    const userTournamentsMap = {};
    tournaments.forEach((tourn) => {
      // Individual registrations
      (tourn.registeredPlayers || []).forEach((reg) => {
        if (reg.player) {
          const pId = reg.player.toString();
          if (!userTournamentsMap[pId]) userTournamentsMap[pId] = [];
          userTournamentsMap[pId].push({
            _id: tourn._id,
            name: tourn.name,
            startDate: tourn.startDate,
            endDate: tourn.endDate,
            status: tourn.status,
            type: 'individual',
            paymentStatus: reg.paymentStatus,
            paymentMethod: reg.paymentMethod,
            registeredAt: reg.registeredAt,
          });
        }
      });

      // Team registrations
      (tourn.registeredTeams || []).forEach((reg) => {
        if (reg.team) {
          const tId = reg.team.toString();
          users.forEach((u) => {
            if (u.team && (u.team._id?.toString() === tId || u.team?.toString() === tId)) {
              const uId = u._id.toString();
              if (!userTournamentsMap[uId]) userTournamentsMap[uId] = [];
              // Prevent duplicates if already added
              if (!userTournamentsMap[uId].some((item) => item._id.toString() === tourn._id.toString())) {
                userTournamentsMap[uId].push({
                  _id: tourn._id,
                  name: tourn.name,
                  startDate: tourn.startDate,
                  endDate: tourn.endDate,
                  status: tourn.status,
                  type: 'team',
                  paymentStatus: reg.paymentStatus,
                  paymentMethod: reg.paymentMethod,
                  registeredAt: reg.registeredAt,
                });
              }
            }
          });
        }
      });
    });

    users.forEach((u) => {
      u.registeredEvents = userTournamentsMap[u._id.toString()] || [];
    });

    res.json({ users, count: users.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin can access any, others can only access themselves)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('team', 'name leader');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Allow access if user is admin or accessing their own profile
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ user });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin can update any, others can only update themselves)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { firstName, lastName, email, username } = req.body;

    // Check if user exists
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Allow update if user is admin or updating their own profile
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Non-admins cannot change role
    if (req.body.role && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can change user roles' });
    }

    // Update fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) user.email = email;
    if (username !== undefined) user.username = username;
    if (req.body.role && req.user.role === 'admin') {
      if (['player', 'admin', 'team_leader'].includes(req.body.role)) {
        user.role = req.body.role;
      }
    }
    if (req.body.isActive !== undefined && req.user.role === 'admin') {
      user.isActive = req.body.isActive;
    }

    // Handle suspension fields (admin only)
    if (req.user.role === 'admin') {
      if (req.body.isSuspended !== undefined) {
        user.isSuspended = req.body.isSuspended;
        if (req.body.isSuspended) {
          user.suspensionReason = req.body.suspensionReason || 'No reason provided';
          user.suspendedAt = new Date();
          user.suspendedBy = req.user._id;
        } else {
          // Clear suspension fields when unsuspending
          user.suspensionReason = undefined;
          user.suspendedAt = undefined;
          user.suspendedBy = undefined;
        }
      }
    }

    await user.save();

    res.json({ 
      message: 'User updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        isSuspended: user.isSuspended,
        suspensionReason: user.suspensionReason,
        suspendedAt: user.suspendedAt
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email or username already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private/Admin
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/users/role/:role
// @desc    Get users by role (Admin and Team Leader can access)
// @access  Private/Admin, TeamLeader
router.get('/role/:role', authenticate, authorize('admin', 'team_leader'), async (req, res) => {
  try {
    const { role } = req.params;

    if (!['player', 'admin', 'team_leader'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const users = await User.find({ role, isActive: true }).select('-password');
    res.json({ users, count: users.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/users/:id/suspend
// @desc    Suspend a user (Admin only)
// @access  Private/Admin
router.post('/:id/suspend', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: 'Suspension reason is required' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from suspending themselves
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Cannot suspend your own account' });
    }

    user.isSuspended = true;
    user.suspensionReason = reason.trim();
    user.suspendedAt = new Date();
    user.suspendedBy = req.user._id;

    await user.save();

    res.json({ 
      message: 'User suspended successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isSuspended: user.isSuspended,
        suspensionReason: user.suspensionReason,
        suspendedAt: user.suspendedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/users/:id/unsuspend
// @desc    Unsuspend a user (Admin only)
// @access  Private/Admin
router.post('/:id/unsuspend', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isSuspended = false;
    user.suspensionReason = undefined;
    user.suspendedAt = undefined;
    user.suspendedBy = undefined;

    await user.save();

    res.json({ 
      message: 'User unsuspended successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isSuspended: user.isSuspended
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

