// src/store/hooks.ts
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

/**
 * Typed useDispatch hook
 * Redux dispatch işlemleri için tip güvenli hook
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed useSelector hook
 * Redux state'e erişim için tip güvenli hook
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;