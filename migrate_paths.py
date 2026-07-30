import json
from pathlib import Path, PureWindowsPath

# ==========================================
# Configuration
# ==========================================
ROOT_FOLDER = r"F:\1. category\RED GIFS"
INPUT_FILE = "SoftPix_Sync_Plan.json"
OUTPUT_FILE = "SoftPix_Sync_Plan.json"
# ==========================================

def main():
    root_path = Path(ROOT_FOLDER)
    input_path = Path(INPUT_FILE)
    output_path = Path(OUTPUT_FILE)

    if not input_path.exists():
        print(f"Error: Input file '{INPUT_FILE}' not found.")
        return

    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading JSON: {e}")
        return

    converted_count = 0
    absolute_count = 0
    missing_files = []

    def process_node(node):
        nonlocal converted_count, absolute_count, missing_files
        
        if isinstance(node, dict):
            for key, value in node.items():
                if key == "sourcePath" and isinstance(value, str):
                    path_obj = Path(value)
                    
                    # Check if the path is already absolute (e.g. F:\...)
                    if path_obj.is_absolute() or (len(value) >= 2 and value[1] == ':'):
                        absolute_count += 1
                    else:
                        # Combine ROOT_FOLDER with the relative path
                        abs_path = root_path / path_obj
                        
                        # Normalize to Windows path separators
                        win_path_str = str(PureWindowsPath(abs_path))
                        
                        # Validate if the file exists on disk
                        if not abs_path.exists():
                            missing_files.append(win_path_str)
                            
                        # Update the value
                        node[key] = win_path_str
                        converted_count += 1
                else:
                    process_node(value)
        elif isinstance(node, list):
            for item in node:
                process_node(item)

    # Process the JSON structure recursively
    process_node(data)

    # Write the output file (this will overwrite the original)
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            # indent=2 generally preserves standard JSON formatting
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error writing JSON output: {e}")
        return

    # Print validation summary
    print(f"Converted: {converted_count}")
    print(f"Already absolute: {absolute_count}")
    print(f"Missing files: {len(missing_files)}")
    print(f"Output: {OUTPUT_FILE}")
    
    if missing_files:
        print("\n--- Missing Files ---")
        for missing_file in missing_files:
            print(missing_file)

if __name__ == "__main__":
    main()
