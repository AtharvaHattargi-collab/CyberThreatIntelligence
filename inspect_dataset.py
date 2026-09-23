import pandas as pd
import os

def analyze_file(filepath):
    print(f"\n========================================")
    print(f"File: {os.path.basename(filepath)}")
    print(f"========================================")
    
    # 1. File Size
    size_mb = os.path.getsize(filepath) / (1024 * 1024)
    print(f"File Size: {size_mb:.2f} MB")
    
    # Load dataset
    df = pd.read_parquet(filepath)
    
    # 2. Rows, Columns
    print(f"Number of rows: {df.shape[0]}")
    print(f"Number of columns: {df.shape[1]}")
    
    # 3. Complete column names
    print(f"\nColumns: {list(df.columns)}")
    
    # 4. Data types
    print("\nData Types:")
    for col, dtype in df.dtypes.items():
        print(f"  {col}: {dtype}")
        
    # 5. Missing / Null values
    print("\nMissing/Null values:")
    missing = df.isnull().sum()
    missing_cols = missing[missing > 0]
    if missing_cols.empty:
        print("  None")
    else:
        for col, count in missing_cols.items():
            print(f"  {col}: {count} missing")
            
    # 6. Duplicate rows
    duplicates = df.duplicated().sum()
    print(f"\nDuplicate rows: {duplicates}")
    
    # 7. Categorical Analysis
    print("\nCategorical Columns Analysis:")
    cat_cols = ['proto', 'service', 'state', 'attack_cat', 'label']
    for col in cat_cols:
        if col in df.columns:
            print(f"  --- {col} ---")
            counts = df[col].value_counts(dropna=False)
            print(counts.to_string())
            print()
    return df

def main():
    train_path = r"D:\CyberThreatIntelligence\dataset\UNSW_NB15_training-set.parquet"
    test_path = r"D:\CyberThreatIntelligence\dataset\UNSW_NB15_testing-set.parquet"
    
    df_train = analyze_file(train_path)
    df_test = analyze_file(test_path)
    
    print("\n========================================")
    print("Comparison (Training vs Testing)")
    print("========================================")
    print(f"Same columns? {list(df_train.columns) == list(df_test.columns)}")
    
    print("\nAny differences in data types?")
    diffs = False
    for col in df_train.columns:
        if col in df_test.columns:
            t1 = df_train[col].dtype
            t2 = df_test[col].dtype
            if t1 != t2:
                print(f"  {col}: Train={t1}, Test={t2}")
                diffs = True
    if not diffs:
        print("  None")
        
    print("\nNumber of normal vs attack records:")
    if 'label' in df_train.columns:
        train_counts = df_train['label'].value_counts()
        print(f"  Train - Normal: {train_counts.get(0, 0)}, Attack: {train_counts.get(1, 0)}")
    if 'label' in df_test.columns:
        test_counts = df_test['label'].value_counts()
        print(f"  Test  - Normal: {test_counts.get(0, 0)}, Attack: {test_counts.get(1, 0)}")

if __name__ == "__main__":
    main()
