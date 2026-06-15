const express = require('express');
const authRoutes = require('./auth.routes');
const healthRoutes = require('./health.routes');
const jobsRoutes = require('./jobs.routes');
const usersRoutes = require('./users.routes');
const candidatesRoutes = require('./candidates.routes');
const companiesRoutes = require('./companies.routes');
const recruitersRoutes = require('./recruiters.routes');
const applicationsRoutes = require('./applications.routes');
const resumesRoutes = require('./resumes.routes');
const savedJobsRoutes = require('./savedJobs.routes');
const notificationsRoutes = require('./notifications.routes');
const interviewsRoutes = require('./interviews.routes');
const analyticsRoutes = require('./analytics.routes');
const adminRoutes = require('./admin.routes');
const subscriptionsRoutes = require('./subscriptions.routes');

const router = express.Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/candidates', candidatesRoutes);
router.use('/companies', companiesRoutes);
router.use('/recruiters', recruitersRoutes);
router.use('/jobs', jobsRoutes);
router.use('/applications', applicationsRoutes);
router.use('/resumes', resumesRoutes);
router.use('/saved-jobs', savedJobsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/interviews', interviewsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);
router.use('/subscriptions', subscriptionsRoutes);

module.exports = router;
