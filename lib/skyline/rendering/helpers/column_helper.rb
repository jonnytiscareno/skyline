module Skyline::Rendering::Helpers::ColumnHelper
  
  # Devides the sections into columns depending on splitter location
  #
  # ==== Parameters
  # page_version<PageVersion>:: The PageVersion to split
  #
  # ==== Returns
  # Array[Array[Section]]:: An array of columns (array of sections)
  # --
  def page_sections_per_column(page_version)
    sections_per_col ||= []
    col = 0
    page_version.sections.each do |section|
      if section.sectionable_type == "Skyline::Sections::SplitterSection" 
        col += 1
      else
        sections_per_col[col] ||= []
        sections_per_col[col].push(section)
      end
    end
    sections_per_col
  end
    
end