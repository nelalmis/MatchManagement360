// src/store/slices/notificationSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { INotification } from '../../types/entity/types';
import NotificationService from '../../services/serviceLayer/notificationService';

interface NotificationState {
  notifications: INotification[];
  unreadCount: number;
  loading: {
    notifications: boolean;
    action: boolean;
  };
  error: string | null;
  filters: {
    type: INotification['type'] | null;
    isRead: boolean | null;
  };
  stats: {
    total: number;
    unread: number;
    read: number;
    byType: Record<string, number>;
    unreadPercentage: number;
  } | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: {
    notifications: false,
    action: false,
  },
  error: null,
  filters: {
    type: null,
    isRead: null,
  },
  stats: null,
};

// ============================================
// ASYNC THUNKS
// ============================================

/**
 * Fetch all notifications for user
 */
export const fetchNotifications = createAsyncThunk<
  INotification[],
  string,
  { rejectValue: string }
>(
  'notification/fetchNotifications',
  async (userId, { rejectWithValue }) => {
    try {
      const result = await NotificationService.getUserNotifications(userId);
      
      if (!result.success) {
        return rejectWithValue(result.error?.message || 'Failed to fetch notifications');
      }
      
      return result.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch notifications');
    }
  }
);

/**
 * Fetch unread notifications
 */
export const fetchUnreadNotifications = createAsyncThunk<
  INotification[],
  string,
  { rejectValue: string }
>(
  'notification/fetchUnreadNotifications',
  async (userId, { rejectWithValue }) => {
    try {
      const result = await NotificationService.getUnreadNotifications(userId);
      
      if (!result.success) {
        return rejectWithValue(result.error?.message || 'Failed to fetch unread notifications');
      }
      
      return result.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch unread notifications');
    }
  }
);

/**
 * Fetch recent notifications
 */
export const fetchRecentNotifications = createAsyncThunk<
  INotification[],
  { userId: string; limit?: number },
  { rejectValue: string }
>(
  'notification/fetchRecentNotifications',
  async ({ userId, limit = 20 }, { rejectWithValue }) => {
    try {
      const result = await NotificationService.getRecentNotifications(userId, limit);
      
      if (!result.success) {
        return rejectWithValue(result.error?.message || 'Failed to fetch recent notifications');
      }
      
      return result.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch recent notifications');
    }
  }
);

/**
 * Fetch notifications by type
 */
export const fetchNotificationsByType = createAsyncThunk<
  INotification[],
  { userId: string; type: INotification['type'] },
  { rejectValue: string }
>(
  'notification/fetchNotificationsByType',
  async ({ userId, type }, { rejectWithValue }) => {
    try {
      const result = await NotificationService.getNotificationsByType(userId, type);
      
      if (!result.success) {
        return rejectWithValue(result.error?.message || 'Failed to fetch notifications by type');
      }
      
      return result.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch notifications by type');
    }
  }
);

/**
 * Fetch unread count
 */
export const fetchUnreadCount = createAsyncThunk<
  number,
  string,
  { rejectValue: string }
>(
  'notification/fetchUnreadCount',
  async (userId, { rejectWithValue }) => {
    try {
      const result = await NotificationService.getUnreadCount(userId);
      
      if (!result.success) {
        return rejectWithValue(result.error?.message || 'Failed to fetch unread count');
      }
      
      return result.data || 0;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch unread count');
    }
  }
);

/**
 * Fetch notification statistics
 */
export const fetchNotificationStats = createAsyncThunk<
  {
    total: number;
    unread: number;
    read: number;
    byType: Record<string, number>;
    unreadPercentage: number;
  },
  string,
  { rejectValue: string }
>(
  'notification/fetchNotificationStats',
  async (userId, { rejectWithValue }) => {
    try {
      const result = await NotificationService.getNotificationStats(userId);
      
      if (!result.success || !result.data) {
        return rejectWithValue(result.error?.message || 'Failed to fetch notification stats');
      }
      
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch notification stats');
    }
  }
);

/**
 * Mark notification as read
 */
export const markAsRead = createAsyncThunk<
  INotification,
  { notificationId: string; userId: string },
  { rejectValue: string }
>(
  'notification/markAsRead',
  async ({ notificationId, userId }, { rejectWithValue }) => {
    try {
      const result = await NotificationService.markAsRead(notificationId, userId);
      
      if (!result.success || !result.data) {
        return rejectWithValue(result.error?.message || 'Failed to mark as read');
      }
      
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark as read');
    }
  }
);

/**
 * Mark notification as unread
 */
export const markAsUnread = createAsyncThunk<
  INotification,
  { notificationId: string; userId: string },
  { rejectValue: string }
>(
  'notification/markAsUnread',
  async ({ notificationId, userId }, { rejectWithValue }) => {
    try {
      const result = await NotificationService.markAsUnread(notificationId, userId);
      
      if (!result.success || !result.data) {
        return rejectWithValue(result.error?.message || 'Failed to mark as unread');
      }
      
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark as unread');
    }
  }
);

/**
 * Mark all notifications as read
 */
export const markAllAsRead = createAsyncThunk<
  number,
  string,
  { rejectValue: string }
>(
  'notification/markAllAsRead',
  async (userId, { rejectWithValue }) => {
    try {
      const result = await NotificationService.markAllAsRead(userId);
      
      if (!result.success) {
        return rejectWithValue(result.error?.message || 'Failed to mark all as read');
      }
      
      return result.data?.marked || 0;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark all as read');
    }
  }
);

/**
 * Delete notification
 */
export const deleteNotification = createAsyncThunk<
  string,
  { notificationId: string; userId: string },
  { rejectValue: string }
>(
  'notification/deleteNotification',
  async ({ notificationId, userId }, { rejectWithValue }) => {
    try {
      const result = await NotificationService.deleteNotification(notificationId, userId);
      
      if (!result.success) {
        return rejectWithValue(result.error?.message || 'Failed to delete notification');
      }
      
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete notification');
    }
  }
);

/**
 * Delete all read notifications
 */
export const deleteAllRead = createAsyncThunk<
  number,
  string,
  { rejectValue: string }
>(
  'notification/deleteAllRead',
  async (userId, { rejectWithValue }) => {
    try {
      const result = await NotificationService.deleteAllRead(userId);
      
      if (!result.success) {
        return rejectWithValue(result.error?.message || 'Failed to delete all read');
      }
      
      return result.data?.deleted || 0;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete all read');
    }
  }
);

/**
 * Delete all notifications
 */
export const deleteAllNotifications = createAsyncThunk<
  number,
  string,
  { rejectValue: string }
>(
  'notification/deleteAllNotifications',
  async (userId, { rejectWithValue }) => {
    try {
      const result = await NotificationService.deleteAllNotifications(userId);
      
      if (!result.success) {
        return rejectWithValue(result.error?.message || 'Failed to delete all notifications');
      }
      
      return result.data?.deleted || 0;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete all notifications');
    }
  }
);

/**
 * Send match invitation
 */
export const sendMatchInvitation = createAsyncThunk<
  INotification,
  { userId: string; matchId: string },
  { rejectValue: string }
>(
  'notification/sendMatchInvitation',
  async ({ userId, matchId }, { rejectWithValue }) => {
    try {
      const result = await NotificationService.sendMatchInvitation(userId, matchId);
      
      if (!result.success || !result.data) {
        return rejectWithValue(result.error?.message || 'Failed to send match invitation');
      }
      
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send match invitation');
    }
  }
);

/**
 * Send match reminder
 */
export const sendMatchReminder = createAsyncThunk<
  INotification,
  { userId: string; matchId: string; hoursUntilMatch: number },
  { rejectValue: string }
>(
  'notification/sendMatchReminder',
  async ({ userId, matchId, hoursUntilMatch }, { rejectWithValue }) => {
    try {
      const result = await NotificationService.sendMatchReminder(
        userId,
        matchId,
        hoursUntilMatch
      );
      
      if (!result.success || !result.data) {
        return rejectWithValue(result.error?.message || 'Failed to send match reminder');
      }
      
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send match reminder');
    }
  }
);

/**
 * Create custom notification
 */
export const createNotification = createAsyncThunk<
  INotification,
  {
    userId: string;
    type: INotification['type'];
    title: string;
    message: string;
    relatedId?: string;
    relatedType?: 'match' | 'league' | 'season' | 'player';
    actionUrl?: string;
    actionLabel?: string;
  },
  { rejectValue: string }
>(
  'notification/createNotification',
  async (data, { rejectWithValue }) => {
    try {
      const result = await NotificationService.createNotification(data);
      
      if (!result.success || !result.data) {
        return rejectWithValue(result.error?.message || 'Failed to create notification');
      }
      
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create notification');
    }
  }
);

// ============================================
// SLICE
// ============================================

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<INotification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    setFilters: (
      state,
      action: PayloadAction<Partial<NotificationState['filters']>>
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetNotificationState: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch Notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading.notifications = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading.notifications = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter((n) => !n.read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading.notifications = false;
        state.error = action.payload || 'Unknown error';
      });

    // Fetch Unread Notifications
    builder
      .addCase(fetchUnreadNotifications.pending, (state) => {
        state.loading.notifications = true;
        state.error = null;
      })
      .addCase(fetchUnreadNotifications.fulfilled, (state, action) => {
        state.loading.notifications = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.length;
      })
      .addCase(fetchUnreadNotifications.rejected, (state, action) => {
        state.loading.notifications = false;
        state.error = action.payload || 'Unknown error';
      });

    // Fetch Recent Notifications
    builder
      .addCase(fetchRecentNotifications.pending, (state) => {
        state.loading.notifications = true;
        state.error = null;
      })
      .addCase(fetchRecentNotifications.fulfilled, (state, action) => {
        state.loading.notifications = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter((n) => !n.read).length;
      })
      .addCase(fetchRecentNotifications.rejected, (state, action) => {
        state.loading.notifications = false;
        state.error = action.payload || 'Unknown error';
      });

    // Fetch Notifications By Type
    builder
      .addCase(fetchNotificationsByType.pending, (state) => {
        state.loading.notifications = true;
        state.error = null;
      })
      .addCase(fetchNotificationsByType.fulfilled, (state, action) => {
        state.loading.notifications = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter((n) => !n.read).length;
      })
      .addCase(fetchNotificationsByType.rejected, (state, action) => {
        state.loading.notifications = false;
        state.error = action.payload || 'Unknown error';
      });

    // Fetch Unread Count
    builder
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      });

    // Fetch Notification Stats
    builder
      .addCase(fetchNotificationStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });

    // Mark As Read
    builder
      .addCase(markAsRead.pending, (state) => {
        state.loading.action = true;
        state.error = null;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        state.loading.action = false;
        
        const index = state.notifications.findIndex((n) => n.id === action.payload.id);
        if (index !== -1) {
          const wasUnread = !state.notifications[index].read;
          state.notifications[index] = action.payload;
          
          if (wasUnread) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
      })
      .addCase(markAsRead.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload || 'Unknown error';
      });

    // Mark As Unread
    builder
      .addCase(markAsUnread.pending, (state) => {
        state.loading.action = true;
        state.error = null;
      })
      .addCase(markAsUnread.fulfilled, (state, action) => {
        state.loading.action = false;
        
        const index = state.notifications.findIndex((n) => n.id === action.payload.id);
        if (index !== -1) {
          const wasRead = state.notifications[index].read;
          state.notifications[index] = action.payload;
          
          if (wasRead) {
            state.unreadCount += 1;
          }
        }
      })
      .addCase(markAsUnread.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload || 'Unknown error';
      });

    // Mark All As Read
    builder
      .addCase(markAllAsRead.pending, (state) => {
        state.loading.action = true;
        state.error = null;
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.loading.action = false;
        state.notifications = state.notifications.map((n) => ({
          ...n,
          read: true,
        }));
        state.unreadCount = 0;
      })
      .addCase(markAllAsRead.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload || 'Unknown error';
      });

    // Delete Notification
    builder
      .addCase(deleteNotification.pending, (state) => {
        state.loading.action = true;
        state.error = null;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.loading.action = false;
        
        const notification = state.notifications.find((n) => n.id === action.payload);
        if (notification && !notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        
        state.notifications = state.notifications.filter((n) => n.id !== action.payload);
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload || 'Unknown error';
      });

      // Delete All Read
    builder
      .addCase(deleteAllRead.pending, (state) => {
        state.loading.action = true;
        state.error = null;
      })
      .addCase(deleteAllRead.fulfilled, (state) => {
        state.loading.action = false;
        state.notifications = state.notifications.filter((n) => !n.read);
      })
      .addCase(deleteAllRead.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload || 'Unknown error';
      });

    // Delete All Notifications
    builder
      .addCase(deleteAllNotifications.pending, (state) => {
        state.loading.action = true;
        state.error = null;
      })
      .addCase(deleteAllNotifications.fulfilled, (state) => {
        state.loading.action = false;
        state.notifications = [];
        state.unreadCount = 0;
      })
      .addCase(deleteAllNotifications.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload || 'Unknown error';
      });

    // Send Match Invitation
    builder
      .addCase(sendMatchInvitation.pending, (state) => {
        state.loading.action = true;
        state.error = null;
      })
      .addCase(sendMatchInvitation.fulfilled, (state, action) => {
        state.loading.action = false;
        state.notifications.unshift(action.payload);
        if (!action.payload.read) {
          state.unreadCount += 1;
        }
      })
      .addCase(sendMatchInvitation.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload || 'Unknown error';
      });

    // Send Match Reminder
    builder
      .addCase(sendMatchReminder.pending, (state) => {
        state.loading.action = true;
        state.error = null;
      })
      .addCase(sendMatchReminder.fulfilled, (state, action) => {
        state.loading.action = false;
        state.notifications.unshift(action.payload);
        if (!action.payload.read) {
          state.unreadCount += 1;
        }
      })
      .addCase(sendMatchReminder.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload || 'Unknown error';
      });

    // Create Notification
    builder
      .addCase(createNotification.pending, (state) => {
        state.loading.action = true;
        state.error = null;
      })
      .addCase(createNotification.fulfilled, (state, action) => {
        state.loading.action = false;
        state.notifications.unshift(action.payload);
        if (!action.payload.read) {
          state.unreadCount += 1;
        }
      })
      .addCase(createNotification.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload || 'Unknown error';
      });
  },
});

export const {
  addNotification,
  setFilters,
  clearFilters,
  clearError,
  resetNotificationState,
} = notificationSlice.actions;

export default notificationSlice.reducer;