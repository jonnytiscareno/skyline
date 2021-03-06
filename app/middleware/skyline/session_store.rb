# This middleware ensures Skyline can use its own database-based session management
# without interfering with implementations that might use ActiveRecord::SessionStore too.

# Due to the way ActiveRecord::SessionStore is set up, it is not possible to use a separate 
# SessionClass in the Engine with a normal configuration, as the class can only be set with the global
# ActiveRecord::SessionStore.session_class = MySessionClass

class Skyline::SessionStore < ActiveRecord::SessionStore
  
  class Session < ActiveRecord::SessionStore::Session
    self.table_name = "skyline_sessions"

    # This method needs to be implemented as the superclass calls remove_method on it
    def self.find_by_session_id(session_id)
      find :first, :conditions => {:session_id=>session_id}
    end
    
  end
  
  def self.session_class
    self.fix_sessions_table_bug

    Skyline::SessionStore::Session
  end

  #
  # On the first use of our own SessionStore Rails will initialize all attribute accessor methods based on our columns.
  # No problem, because it can read that from the DB and our table 'skyline_session'.
  # However, rails will first try to initialize accessor methods for our superclass ActiveRecord::SessionStore::Session.
  # That will fail if there is no 'sessions' table, because the default table_name of the Rails SessionStore is 'sessions'.
  # So we set the table_name to our table in this situation.
  # <RW> I'm a bit unsure on were to call this function from.
  #
  def self.fix_sessions_table_bug
    if !ActiveRecord::SessionStore::Session.table_exists? && ActiveRecord::SessionStore::Session.table_name == "sessions"
      ActiveRecord::SessionStore::Session.table_name = "skyline_sessions"
    end
  end

  # As these functions use @@session_store in the original, overwrite them to be sure 
  # that yes, we really want to use our session store for Skyline only.
  private
  def get_session(env, sid)
    ActiveRecord::Base.silence do
      unless sid and session = self.class.session_class.find_by_session_id(sid)
        # If the sid was nil or if there is no pre-existing session under the sid,
        # force the generation of a new sid and associate a new session associated with the new sid
        sid = generate_sid
        session = self.class.session_class.new(:session_id => sid, :data => {})
      end
      env[SESSION_RECORD_KEY] = session
      [sid, session.data]
    end
  end
  
  def find_session(id)
    self.class.session_class.find_by_session_id(id) ||
      self.class.session_class.new(:session_id => id, :data => {})
  
  end
end
