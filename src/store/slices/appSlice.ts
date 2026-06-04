import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  collection,
  query,
  orderBy,
  getDocs,
  where,
  limit,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Match, NewsItem, Training, Championship, Fee } from '../../types';

interface AppState {
  matches: Match[];
  matchesLoading: boolean;
  news: NewsItem[];
  newsLoading: boolean;
  trainings: Training[];
  trainingsLoading: boolean;
  championships: Championship[];
  championshipsLoading: boolean;
  fees: Fee[];
  feesLoading: boolean;
}

const initialState: AppState = {
  matches: [],
  matchesLoading: false,
  news: [],
  newsLoading: false,
  trainings: [],
  trainingsLoading: false,
  championships: [],
  championshipsLoading: false,
  fees: [],
  feesLoading: false,
};

export const fetchMatches = createAsyncThunk('app/fetchMatches', async () => {
  const snap = await getDocs(query(collection(db, 'matches'), orderBy('scheduledAt', 'desc'), limit(50)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Match));
});

export const fetchNews = createAsyncThunk('app/fetchNews', async () => {
  const snap = await getDocs(query(collection(db, 'news'), orderBy('publishedAt', 'desc'), limit(20)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as NewsItem));
});

export const fetchTrainings = createAsyncThunk('app/fetchTrainings', async () => {
  const snap = await getDocs(query(collection(db, 'trainings'), orderBy('scheduledAt', 'desc'), limit(30)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Training));
});

export const fetchChampionships = createAsyncThunk('app/fetchChampionships', async () => {
  const snap = await getDocs(query(collection(db, 'championships'), where('isActive', '==', true)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Championship));
});

export const fetchFees = createAsyncThunk('app/fetchFees', async (userId: string) => {
  const snap = await getDocs(
    query(collection(db, 'fees'), where('userId', '==', userId), orderBy('year', 'desc'), orderBy('month', 'desc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Fee));
});

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    updateMatch(state, action: PayloadAction<Match>) {
      const idx = state.matches.findIndex((m) => m.id === action.payload.id);
      if (idx >= 0) state.matches[idx] = action.payload;
      else state.matches.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatches.pending, (state) => { state.matchesLoading = true; })
      .addCase(fetchMatches.fulfilled, (state, action) => { state.matchesLoading = false; state.matches = action.payload; })
      .addCase(fetchMatches.rejected, (state) => { state.matchesLoading = false; })
      .addCase(fetchNews.pending, (state) => { state.newsLoading = true; })
      .addCase(fetchNews.fulfilled, (state, action) => { state.newsLoading = false; state.news = action.payload; })
      .addCase(fetchNews.rejected, (state) => { state.newsLoading = false; })
      .addCase(fetchTrainings.pending, (state) => { state.trainingsLoading = true; })
      .addCase(fetchTrainings.fulfilled, (state, action) => { state.trainingsLoading = false; state.trainings = action.payload; })
      .addCase(fetchTrainings.rejected, (state) => { state.trainingsLoading = false; })
      .addCase(fetchChampionships.pending, (state) => { state.championshipsLoading = true; })
      .addCase(fetchChampionships.fulfilled, (state, action) => { state.championshipsLoading = false; state.championships = action.payload; })
      .addCase(fetchChampionships.rejected, (state) => { state.championshipsLoading = false; })
      .addCase(fetchFees.pending, (state) => { state.feesLoading = true; })
      .addCase(fetchFees.fulfilled, (state, action) => { state.feesLoading = false; state.fees = action.payload; })
      .addCase(fetchFees.rejected, (state) => { state.feesLoading = false; });
  },
});

export const { updateMatch } = appSlice.actions;
export default appSlice.reducer;
