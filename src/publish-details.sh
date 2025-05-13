# #!/bin/bash

# # Define the input and output folders
# input_folder="../data/sbom-components-csv-deprecated"
# output_folder="../data/sbom-repo-wise"

# # Create the output folder if it doesn't exist
# mkdir -p "$output_folder"

# # Loop over every CSV file in the input folder
# for input_file in "$input_folder"/*.csv; do
#     # Extract the filename (without folder path)
#     filename=$(basename "$input_file")
    
#     # Define output file path
#     output_file="$output_folder/$filename"
    
#     echo "Processing file: $filename"

#     # Clear or create the output file
#     > "$output_file"

#     # Read the header and write it with extra publish_details
#     IFS= read -r header < "$input_file"
#     echo "${header},publish_details" >> "$output_file"

#     # Read and process each line except header
#     while IFS= read -r line; do
#         original_line="$line"

#         # Extract bom_ref (2nd column)
#         IFS=',' read -r type bom_ref _ <<< "$line"

#         # If bom_ref has pipes, take the last segment
#         IFS='|' read -r -a array <<< "$bom_ref"
#         bom_ref=${array[${#array[@]}-1]}

#         # Run npm view
#         npm_output=$(npm view "$bom_ref" 2>/dev/null)

#         if [ $? -eq 0 ]; then
#             last_line=$(echo "$npm_output" | tail -n 1)
#             echo "$original_line,$last_line" >> "$output_file"
#         else
#             echo "$original_line,Impossible" >> "$output_file"
#         fi
#     done < <(tail -n +2 "$input_file")

#     echo "Finished processing $filename -> Saved to $output_file"
# done

# echo "All files processed!"

#!/bin/bash

#!/bin/bash

input_folder="./data/sbom-components-csv-deprecated"
output_folder="./data/sbom-repo-wise2"

mkdir -p "$output_folder"

for input_file in "$input_folder"/*.csv; do
    filename=$(basename "$input_file")
    output_file="$output_folder/$filename"
    temp_dir=$(mktemp -d)

    echo "Processing file: $filename"
    > "$output_file"

    # Write header with additional column
    IFS= read -r header < "$input_file"
    echo "${header},publish_details" >> "$output_file"

    # Prepare lines for processing
    tail -n +2 "$input_file" > "$temp_dir/lines.txt"

    # Process each line in parallel
    cat "$temp_dir/lines.txt" | xargs -n 1 -P 8 -I{} bash -c '
        line="$1"
        original_line="$line"
        IFS="," read -r type bom_ref rest <<< "$line"

        # Get last pipe-separated segment
        if [[ "$bom_ref" == *"|"* ]]; then
            IFS="|" read -r -a array <<< "$bom_ref"
            bom_ref="${array[${#array[@]}-1]}"
        fi

        # Get NPM publish info
        npm_output=$(npm view "$bom_ref" 2>/dev/null)
        if [ $? -eq 0 ]; then
            last_line=$(echo "$npm_output" | tail -n 1)
            echo "$original_line,$last_line"
        else
            echo "$original_line,Impossible"
        fi
    ' _ "{}" >> "$output_file"

    rm -r "$temp_dir"
    echo "Finished processing $filename -> Saved to $output_file"
done

echo "All files processed!"
