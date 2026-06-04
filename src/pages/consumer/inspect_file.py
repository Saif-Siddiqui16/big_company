with open(r'c:\Users\Admin\Desktop\big_pos\frontend\src\pages\consumer\WalletPage.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    for i in range(458, 465):
        print(f"{i+1}: {repr(lines[i])}")
