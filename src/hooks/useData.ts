import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Session, Task, Settings } from '../types/data';

export const useData = () => {
  const { user } = useAuth();
  const [sessions, setSessions
