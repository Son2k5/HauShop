import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';

interface BannerState {
  dotActive: number;
}
const initialState: BannerState = {
  dotActive: 0,
};
const bannerSlice = createSlice({
  name: 'banner',
  initialState,
  reducers: {
    setDotActive(state, action: PayloadAction<number>) {
      state.dotActive = action.payload;
    },
  },
});
export const { setDotActive } = bannerSlice.actions;
export default bannerSlice.reducer;
