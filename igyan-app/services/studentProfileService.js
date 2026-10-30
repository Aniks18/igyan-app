/**
 * iGyan App - Student profile service (ported from igyan-mvp
 * /api/student-profile GET/POST on table `student_profiles`)
 *
 * The service translates between the database row shape and the component
 * profile shape used by the Viva AI screens.
 */
import { supabase } from '../utils/supabase';

/** Database row -> component profile shape. */
export function toComponentProfile(row) {
  if (!row) return null;
  return {
    name: row.name,
    age: row.age,
    class: row.class,
    section: row.section,
    house: row.house || '',
    classTeacher: row.class_teacher || '',
    school: {
      name: row.school_name || '',
      location: row.school_location || '',
      board: row.school_board || '',
    },
    interests: row.interests || [],
    learningStyle: row.learning_style || '',
    strengths: row.strengths || [],
    growthAreas: row.growth_areas || [],
    academicGoals: row.academic_goals || [],
    recentWins: row.recent_wins || [],
    sleepTime: row.sleep_time || '',
    studySchedule: {
      weekday: row.study_schedule_weekday || '',
      weekend: row.study_schedule_weekend || '',
    },
    favoriteSubjects: row.favorite_subjects || [],
    mentors: [],
    funFact: row.fun_fact || '',
  };
}

/** Component profile shape -> database row shape. */
export function toDatabaseProfile(userId, profile) {
  return {
    user_id: userId,
    name: profile.name,
    age: profile.age,
    class: profile.class,
    section: profile.section,
    house: profile.house || null,
    class_teacher: profile.classTeacher || null,
    school_name: profile.school?.name || null,
    school_location: profile.school?.location || null,
    school_board: profile.school?.board || null,
    interests: profile.interests || [],
    learning_style: profile.learningStyle || null,
    strengths: profile.strengths || [],
    growth_areas: profile.growthAreas || [],
    academic_goals: profile.academicGoals || [],
    recent_wins: profile.recentWins || [],
    sleep_time: profile.sleepTime || null,
    study_schedule_weekday: profile.studySchedule?.weekday || null,
    study_schedule_weekend: profile.studySchedule?.weekend || null,
    favorite_subjects: profile.favoriteSubjects || [],
    fun_fact: profile.funFact || null,
    updated_at: new Date().toISOString(),
  };
}

/** Fetch the student profile for a user (null when none exists). */
export async function getStudentProfile(userId) {
  if (!userId) throw new Error('User ID is required.');
  const { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw new Error(`getStudentProfile: ${error.message}`);
  return toComponentProfile(data);
}

/** Create or update the student profile for a user. */
export async function saveStudentProfile(userId, profile) {
  if (!userId || !profile) throw new Error('User ID and profile data are required.');
  const { data, error } = await supabase
    .from('student_profiles')
    .upsert(toDatabaseProfile(userId, profile), { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw new Error(`saveStudentProfile: ${error.message}`);
  return data;
}
