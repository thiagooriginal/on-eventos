import os
import ftplib
import sys

def upload_dir(ftp, local_dir, remote_dir):
    try:
        ftp.cwd(remote_dir)
    except Exception:
        try:
            ftp.mkd(remote_dir)
        except Exception:
            pass
        ftp.cwd(remote_dir)

    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        if os.path.isdir(local_path):
            upload_dir(ftp, local_path, item)
            ftp.cwd("..")
        else:
            with open(local_path, "rb") as f:
                print(f"  -> Uploading: {item}")
                ftp.storbinary(f"STOR {item}", f)

def main():
    server = os.environ.get("FTP_SERVER")
    user = os.environ.get("FTP_USER")
    password = os.environ.get("FTP_PASS")

    if not server or not user or not password:
        print("Erro: FTP_SERVER, FTP_USER ou FTP_PASS não configurados.")
        sys.exit(1)

    print(f"Conectando via FTP a {server} com usuário {user}...")
    ftp = ftplib.FTP(server, user, password, timeout=60)
    print(f"Conectado com sucesso! Diretório inicial: {ftp.pwd()}")
    print("\n--- Estrutura do servidor FTP ---")
    ftp.dir()
    print("---------------------------------\n")

    # Identificar a pasta public_html correta
    target_dirs = []
    
    # 1. Checar public_html na raiz
    try:
        ftp.cwd("/public_html")
        target_dirs.append("/public_html")
        print("Encontrado: /public_html")
    except Exception:
        try:
            ftp.cwd("public_html")
            target_dirs.append("public_html")
            print("Encontrado: public_html")
        except Exception:
            pass

    # 2. Checar domains/onagenciadeeventos.com.br/public_html
    try:
        ftp.cwd("/domains/onagenciadeeventos.com.br/public_html")
        target_dirs.append("/domains/onagenciadeeventos.com.br/public_html")
        print("Encontrado: /domains/onagenciadeeventos.com.br/public_html")
    except Exception:
        try:
            ftp.cwd("domains/onagenciadeeventos.com.br/public_html")
            target_dirs.append("domains/onagenciadeeventos.com.br/public_html")
            print("Encontrado: domains/onagenciadeeventos.com.br/public_html")
        except Exception:
            pass

    if not target_dirs:
        print("Aviso: Tentando diretório atual...")
        target_dirs = ["."]

    for target in target_dirs:
        print(f"\n==========================================")
        print(f"Publicando em: {target}")
        print(f"==========================================")
        ftp.cwd(target)

        out_dir = "./out"
        if not os.path.exists(out_dir):
            print(f"Erro: Pasta {out_dir} não encontrada!")
            sys.exit(1)

        for item in os.listdir(out_dir):
            local_path = os.path.join(out_dir, item)
            if os.path.isdir(local_path):
                upload_dir(ftp, local_path, item)
                ftp.cwd("..")
            else:
                with open(local_path, "rb") as f:
                    print(f"  -> Uploading: {item}")
                    ftp.storbinary(f"STOR {item}", f)

    print("\n Deploy concluído com 100% de sucesso!")
    ftp.quit()

if __name__ == "__main__":
    main()
