import os

def merge_all_js(target_folder, output_name):
    # Get the absolute path to prevent the script from reading its own output
    output_abs_path = os.path.abspath(output_name)
    
    with open(output_name, 'w', encoding='utf-8') as outfile:
        # os.walk yields: root (string), dirs (list), files (list)
        for root, dirs, files in os.walk(target_folder):
            
            # --- THE FIX: IGNORE NODE_MODULES ---
            # Modifying 'dirs' in-place tells os.walk NOT to enter these folders
            if 'node_modules' in dirs:
                dirs.remove('node_modules')
            
            # Optional: Ignore other common folders like .git or dist
            if '.git' in dirs:
                dirs.remove('.git')

            for filename in files:
                # Only process .js files
                if filename.endswith('.jsx'):
                    file_path = os.path.join(root, filename)
                    
                    # Ensure we don't try to merge the output file into itself
                    if os.path.abspath(file_path) == output_abs_path:
                        continue
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8') as infile:
                            # Add a visual separator for clarity
                            outfile.write(f"// Start of: {file_path}\n")
                            outfile.write(infile.read())
                            outfile.write("\n// End of file\n\n")
                            print(f"Successfully merged: {filename}")
                    except Exception as e:
                        print(f"Skipped {filename} due to error: {e}")

# --- Execution ---
target_directory = './client'  # The folder containing your JS files
output_file = 'frontBundle.js'      # The final combined file

merge_all_js(target_directory, output_file)
print(f"\n--- Done! All files merged into {output_file} ---")
