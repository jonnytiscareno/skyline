# @private
class Skyline::InlineRef < Skyline::RefObject  

  attr_accessor :previous_referable
  after_save :possibly_destroy_previous_referable
  after_destroy :possibly_destroy_referable

  class << self    
    # Convert an html tag to RefObject tag and update or create RefObject in database
    #
    # @param [String] html the html node from the editor
    # @param [Object] refering_object refering object
    # @param [Symbol] refering_column_name column name in which the data is stored
    # 
    # @return [Array[String, Array]] An array containing the converted html and a list of IDS of refs in the HTML
    def parse_html(html, refering_object, refering_column_name)
      old_refs = find_ref_ids_for_object(refering_object, refering_column_name)
      
      h = Nokogiri::HTML::DocumentFragment.parse(html)
      updated_refs = []
      
      # html tags to be converted to [REF:id]
      iterate_elements = {"a" => {:src => "href", :inner_html => true, :skyline_class => Skyline::LinkRef}, 
                          "img" => {:src => "src", :inner_html => false, :skyline_class => Skyline::ImageRef}                                          
                          } 
      
      process_tags = lambda{|tag, attributes, node|
        ref_obj_id = create_ref_from_node(node, refering_object, refering_column_name, attributes[:src], attributes[:skyline_class])
        if attributes[:inner_html]
          node.swap("[REF:#{ref_obj_id}]#{node.inner_html}[/REF:#{ref_obj_id}]")
        else
          node.swap("[REF:#{ref_obj_id}]")
        end
                
        updated_refs << ref_obj_id        
      }
      
      iterate_elements.each do |tag, attributes|
        h.css("#{tag}[data-skyline-referable-type]").each{ |node| process_tags.call(tag, attributes, node) }
        
        # Deprecated
        h.css("#{tag}[skyline-referable-type]").each{ |node| process_tags.call(tag, attributes, node) }
      end
      
      del = (old_refs - updated_refs)
      unless del.blank?
        self.destroy_all("id IN(#{del.join(',')})") 
        logger.debug("[InlineRef] Destroying refs for #{refering_object.class.name} id: #{refering_object.id} column: #{refering_column_name}. Ref's destroyed: #{del.inspect}")
      end
      
      [h.to_s, updated_refs]
    end
    
    # Convert a string containing [REF] references into html
    # 
    # @param [String] ref_html The HTML containing [REF] references
    # @param [Object] refering_object The object containing the string to be converted
    # @param [String] refering_column_name Name of column containing the string to be converted
    # @param [Boolean] include_ref_data Boolean that sets wether to print skyline-reference attributes into the html tags (default = false)
    # 
    # @option options [Boolean] :nullify Wether of not to nullify the ID's of the refs to force creation of new refs (needed for cloning)
    # 
    # @return [String] Converted html text
    def compile_html(ref_html, refering_object, refering_column_name, include_ref_data = false, options = {})
      options.reverse_merge! :nullify => false

      return ref_html unless ref_html.kind_of?(String)
      
      refs = self.hash_refs_for_object(refering_object, refering_column_name)
      v = ref_html.gsub(/\[REF:(\d+)\]/) do |match|
        i = match[5..-2]
        refs[i.to_i].to_start_html(include_ref_data, options)
      end
    
      outp = v.gsub(/\[\/REF:(\d+)\]/) do |match|
        i = match[6..-2]
        refs[i.to_i].to_end_html
      end      
    end
    
    
    # Create hash of InlineRef objects for specified object and column name
    #
    # @param [Object] refering_object the object containing the Inline Refs
    # @param [String] refering_column_name column name in which the inline refs are stored as [REF:id] tags
    #
    # @return [Hash] a hash of inlinerefs with id as key and object as value
    def hash_refs_for_object(refering_object, refering_column_name)
      types = [Skyline::ImageRef,Skyline::LinkRef].map(&:name)
      refs = Skyline::RefObject.all(:conditions => {:refering_id => refering_object.id, :refering_type => refering_object.class.name, :refering_column_name => refering_column_name.to_s, :type => types})
      refs.inject({}){|mem,o| mem[o.id] = o; mem }
    end
    
    # Convert [REF:id] tags to html tags
    #
    # @see Skyline::InlineRef#compile_html
    def convert(refering_object, refering_column_name, include_ref_data=false, options={})
      compile_html(refering_object[refering_column_name], refering_object, refering_column_name, include_ref_data, options)
    end
    
    private
    # find ref idss by sql for refering object
    # ==== Parameters
    # refering_object<Object>:: Object containing the refs
    # refering_column_name<Symbol>:: column name where refs are stored
    #
    # ==== Returns
    # Array:: Array of ids of refering objects
    def find_ref_ids_for_object(refering_object, refering_column_name)            
      Skyline::InlineRef.connection.select_values("SELECT id FROM #{self.table_name} WHERE refering_id = '#{refering_object.id}' AND refering_type = '#{refering_object.class.name}' AND refering_column_name = '#{refering_column_name.to_s}'").map(&:to_i)
    end
    
    # Create an InlineRef instance from html node
    #
    # @param [String] html_node html node to be converted to ref_object
    # @param [Object] refering_object object containing the html node
    # @param [Symbol] refering_column_name column name of the object containing the html node
    # @param [String] src_attr attribute of the html node containing the source of the element
    # @param [Class] skyline_class sti class for the ref_object
    #
    # @return [Integer] id of the new ref_object
    def create_ref_from_node(html_node, refering_object, refering_column_name, src_attr, skyline_class)
      id, ref_id, ref_type = remove_attributes(html_node, ["data-skyline-ref-id", "data-skyline-referable-id", "data-skyline-referable-type"])
      
      # Deprecated attributes
      d_id, d_ref_id, d_ref_type = remove_attributes(html_node, ["skyline-ref-id", "skyline-referable-id", "skyline-referable-type"])
      
      id ||= d_id
      ref_id ||= d_ref_id
      ref_type ||= d_ref_type
      
      referable_params = {}
      referable_params[:uri] = html_node[:href]

      options = []        
      html_node.remove_attribute(src_attr)
      
      options = html_node.attributes.to_hash.inject({}) do |result, element|
        result[element.first.to_s] = element.last.to_s
        result
      end
   
      new_ref = skyline_class.find_by_id_and_refering_type_and_refering_id_and_refering_column_name(id,refering_object.class.name,refering_object.id,refering_column_name.to_s) if id
      new_ref ||= skyline_class.new

      new_ref.previous_referable = new_ref.referable if new_ref.referable
        
      new_ref.attributes = {
        :options => options, 
        :refering_column_name => refering_column_name.to_s
      }
      new_ref.referable_id = ref_id
      new_ref.referable_type = ref_type
      new_ref.refering_id = refering_object.id
      new_ref.refering_type = refering_object.class.name
      
      new_ref.referable.reload if new_ref.referable
      
      if ref_type == "Skyline::ReferableUri"
        if new_ref.new_record?
          new_ref.referable = ref_type.constantize.new
        else
          new_ref.referable ||= ref_type.constantize.new
        end

        if referable_params.kind_of?(Hash)
          referable_params.each do |k, v|
            new_ref.referable.send(k.to_s + "=", v) if new_ref.referable.respond_to?(k.to_s + "=")
          end
        end
      end
      
      new_ref.save!
      
      new_ref.id
    end
    
    # Remove multiple attributes from html_node
    # ==== Parameters
    # node<String>:: html node
    # attributes<Array>:: attributes to be stripped
    # ==== Returns
    # Array:: values of removed attributes
    def remove_attributes(node, attributes)
      attributes.inject([]) do |result, attribute|
        if node.has_attribute?(attribute)
          result << node.remove_attribute(attribute).to_s.strip 
        else 
          result << nil
        end
      end
    end
  end
  
  protected
    
  def possibly_destroy_previous_referable
    return unless self.previous_referable
    if self.previous_referable != self.referable && self.previous_referable.kind_of?(Skyline::ReferableUri)
      self.previous_referable.destroy
    end
  end

  def possibly_destroy_referable
    self.referable.destroy if self.referable.kind_of?(Skyline::ReferableUri)
  end  
end