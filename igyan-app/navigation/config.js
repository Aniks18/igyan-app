/**
 * iGyan App - Navigation Configuration
 * Central navigation configuration for the educational app
 */

export const NavigationConfig = {
  // Tab Navigation Screens
  tabs: {
    home: {
      name: 'home',
      title: 'Home',
      icon: 'house.fill',
    },
    courses: {
      name: 'courses',
      title: 'Courses',
      icon: 'book.fill',
    },
    explore: {
      name: 'explore',
      title: 'Explore',
      icon: 'magnifyingglass',
    },
    profile: {
      name: 'profile',
      title: 'Profile',
      icon: 'person.fill',
    },
  },

  // Stack Navigation Screens
  screens: {
    courseDetail: {
      name: 'courseDetail',
      title: 'Course Details',
    },
    lessonPlayer: {
      name: 'lessonPlayer',
      title: 'Lesson',
    },
    settings: {
      name: 'settings',
      title: 'Settings',
    },
  },

  // Modal Screens
  modals: {
    login: {
      name: 'login',
      title: 'Login',
    },
    signup: {
      name: 'signup',
      title: 'Sign Up',
    },
  },
};

export const Routes = {
  HOME: '/(tabs)/home',
  COURSES: '/(tabs)/courses',
  EXPLORE: '/(tabs)/explore',
  PROFILE: '/(tabs)/profile',
  COURSE_DETAIL: '/course/[id]',
  LESSON: '/lesson/[id]',
  SETTINGS: '/settings',
  LOGIN: '/login',
  SIGNUP: '/signup',
};
