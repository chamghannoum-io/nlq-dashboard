import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://rudnfxearvrrzasklclx.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('❌ VITE_SUPABASE_ANON_KEY is not set in .env file');
}

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fetch all sessions with their latest chat history
 * @param {number} limit - Number of sessions to fetch
 * @returns {Promise<Array>} Array of sessions with chat history
 */
export const fetchSessionHistory = async (limit = 50) => {
  try {
    // First, get all sessions ordered by most recent
    const { data: sessions, error: sessionsError } = await supabase
      .from('session_memory')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      throw sessionsError;
    }

    if (!sessions || sessions.length === 0) {
      return [];
    }

    // Get session IDs
    const sessionIds = sessions.map(s => s.session_id);

    // Fetch all chat history for these sessions
    const { data: chatHistory, error: chatError } = await supabase
      .from('chat_history')
      .select('*')
      .in('session_id', sessionIds)
      .order('timestamp', { ascending: false });

    if (chatError) {
      console.error('Error fetching chat history:', chatError);
      throw chatError;
    }

    // Group chat history by session and get the most recent entry for each session
    const sessionMap = new Map();
    
    sessions.forEach(session => {
      sessionMap.set(session.session_id, {
        session,
        chats: []
      });
    });

    // Add chats to their respective sessions
    chatHistory?.forEach(chat => {
      if (sessionMap.has(chat.session_id)) {
        sessionMap.get(chat.session_id).chats.push(chat);
      }
    });

    // Transform to the format expected by the UI
    const formattedHistory = Array.from(sessionMap.values())
      .filter(item => item.chats.length > 0) // Only include sessions with chat history
      .map(item => {
        // Sort chats chronologically (oldest first) to get the first question
        const sortedChats = [...item.chats].sort((a, b) => 
          new Date(a.timestamp) - new Date(b.timestamp)
        );
        
        const firstChat = sortedChats[0]; // Get the FIRST question in the session
        const mostRecentChat = item.chats[0]; // Most recent for timestamp sorting
        
        return {
          session_id: item.session.session_id,
          question: firstChat.question, // Show first question in sidebar
          answer: firstChat.answer,
          card_name: firstChat.card_name || firstChat.question,
          card_id: mostRecentChat.card_id, // Use most recent card for visualization
          embed_url: mostRecentChat.embed_url, // Use most recent embed
          sql_query: firstChat.sql_query,
          data: firstChat.data,
          timestamp: mostRecentChat.timestamp, // Use most recent timestamp for sorting
          turn_count: item.session.turn_count,
          all_chats: item.chats // Include all chats for this session
        };
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return formattedHistory;
  } catch (error) {
    console.error('Error in fetchSessionHistory:', error);
    return [];
  }
};

/**
 * Fetch complete chat history for a specific session
 * @param {string} sessionId - The session ID to fetch
 * @returns {Promise<Object>} Session with all chat messages
 */
export const fetchSessionById = async (sessionId) => {
  try {
    // Get session info
    const { data: session, error: sessionError } = await supabase
      .from('session_memory')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (sessionError) {
      console.error('Error fetching session:', sessionError);
      throw sessionError;
    }

    // Get all chats for this session
    const { data: chats, error: chatsError } = await supabase
      .from('chat_history')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true }); // Ascending for chronological order

    if (chatsError) {
      console.error('Error fetching chats:', chatsError);
      throw chatsError;
    }

    return {
      session,
      chats: chats || []
    };
  } catch (error) {
    console.error('Error in fetchSessionById:', error);
    return null;
  }
};

/**
 * Save a new chat message to the database
 * @param {string} sessionId - The session ID
 * @param {Object} chatData - Chat data to save
 * @returns {Promise<Object>} Saved chat record
 */
export const saveChatMessage = async (sessionId, chatData) => {
  try {
    const { data, error } = await supabase
      .from('chat_history')
      .insert([{
        session_id: sessionId,
        question: chatData.question,
        answer: chatData.answer,
        sql_query: chatData.sql_query,
        data: chatData.data,
        card_id: chatData.card_id,
        card_name: chatData.card_name,
        public_uuid: chatData.public_uuid,
        embed_url: chatData.embed_url,
        has_subworkflow: chatData.has_subworkflow,
        subworkflow_type: chatData.subworkflow_type,
        actions_taken: chatData.actions_taken,
        columns: chatData.columns
      }])
      .select()
      .single();

    if (error) {
      console.error('Error saving chat message:', error);
      throw error;
    }

    // Update session memory - increment turn count
    const { data: sessionData } = await supabase
      .from('session_memory')
      .select('turn_count')
      .eq('session_id', sessionId)
      .single();

    await supabase
      .from('session_memory')
      .upsert({
        session_id: sessionId,
        last_question: chatData.question,
        last_answer: chatData.answer,
        turn_count: (sessionData?.turn_count || 0) + 1,
        updated_at: new Date().toISOString()
      });

    return data;
  } catch (error) {
    console.error('Error in saveChatMessage:', error);
    return null;
  }
};

/**
 * Create or update session memory
 * @param {string} sessionId - The session ID
 * @param {Object} context - Context data
 * @returns {Promise<Object>} Session record
 */
export const upsertSession = async (sessionId, context = {}) => {
  try {
    const { data, error } = await supabase
      .from('session_memory')
      .upsert({
        session_id: sessionId,
        context: context,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'session_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting session:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in upsertSession:', error);
    return null;
  }
};

/**
 * Fetch random questions from marsad_questions table
 * @param {number} limit - Number of random questions to fetch
 * @returns {Promise<Array>} Array of random questions
 */
export const fetchRandomQuestions = async (limit = 3) => {
  try {
    console.log('Fetching random questions from marsad_questions table...');
    
    // Get total count first
    const { count, error: countError } = await supabase
      .from('marsad_questions')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting questions:', countError);
      return [];
    }

    console.log('Total questions in database:', count);

    if (!count || count === 0) {
      console.warn('No questions found in marsad_questions table');
      return [];
    }

    // Generate random offset
    const maxOffset = Math.max(0, count - limit);
    const randomOffset = Math.floor(Math.random() * maxOffset);

    console.log(`Fetching ${limit} questions with offset ${randomOffset}`);

    // Fetch random questions
    const { data, error } = await supabase
      .from('marsad_questions')
      .select('*')
      .range(randomOffset, randomOffset + limit - 1);

    if (error) {
      console.error('Error fetching random questions:', error);
      return [];
    }

    console.log('Questions fetched:', data);
    return data || [];
  } catch (error) {
    console.error('Error in fetchRandomQuestions:', error);
    return [];
  }
};

/**
 * Search questions based on partial text match
 * @param {string} searchText - The text to search for
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} Array of matching questions
 */
export const searchQuestions = async (searchText, limit = 10) => {
  try {
    if (!searchText || searchText.trim().length < 3) {
      return []; // Only search if at least 3 characters
    }

    const { data, error } = await supabase
      .from('marsad_questions')
      .select('*')
      .ilike('question', `${searchText}%`) // Match questions starting with searchText
      .limit(limit);

    if (error) {
      console.error('Error searching questions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchQuestions:', error);
    return [];
  }
};

export default {
  fetchSessionHistory,
  fetchSessionById,
  saveChatMessage,
  upsertSession,
  fetchRandomQuestions,
  searchQuestions
};

