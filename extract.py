import sys

def extract_schema(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8', errors='ignore') as f_in, \
         open(output_file, 'w', encoding='utf-8') as f_out:
        
        in_create = False
        for line in f_in:
            if line.startswith('CREATE TABLE'):
                in_create = True
            
            if in_create:
                f_out.write(line)
                if line.strip().endswith(';'):
                    in_create = False
                    f_out.write('\n')
                    continue
            
            if line.startswith('ALTER TABLE') or line.startswith('DROP TABLE'):
                f_out.write(line)

if __name__ == '__main__':
    extract_schema(sys.argv[1], sys.argv[2])
