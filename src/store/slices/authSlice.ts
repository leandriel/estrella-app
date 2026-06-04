import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { loginWithEmail, logout as logoutService } from '../../services/authService';
import { User } from '../../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = { user: null, loading: false, error: null };

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      return await loginWithEmail(email, password);
    } catch (e: any) {
      return rejectWithValue(e.message ?? 'Error al iniciar sesión');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await logoutService();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
      .addCase(login.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(logout.fulfilled, (state) => { state.user = null; state.loading = false; });
  },
});

export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;
