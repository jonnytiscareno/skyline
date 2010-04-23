class CreateRights < ActiveRecord::Migration
  def self.up
    create_table :skyline_rights do |t|
      t.column :name, :string
      t.timestamps
    end
  end

  def self.down
    drop_table :skyline_rights
  end
end
