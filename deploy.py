import os
import ftplib
import sys
import time

def upload_file_with_retry(ftp, local_path, item, max_retries=3):
    for attempt in range(1, max_retries + 1):
        try:
            with open(local_path, "rb") as f:
                print(f"  -> Uploading: {item}")
                ftp.storbinary(f"STOR {item}", f)
            return True
        except Exception as e:
            print(f"  [Tentativa {attempt}/{max_retries}] Erro ao enviar {item}: {e}")
            if attempt < max_retries:
                time.sleep(2)
            else:
                print(f"  Aviso: Não foi possível enviar {item} após {max_retries} tentativas.")
                return False

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
            upload_file_with_retry(ftp, local_path, item)

def conectar_ftp(server, user, password, max_retries=5):
    for tentativa in range(1, max_retries + 1):
        try:
            print(f"[{tentativa}/{max_retries}] Conectando com transporte seguro TLS a {server}...")
            ftp = ftplib.FTP_TLS(timeout=45)
            ftp.connect(server, 21)
            ftp.login(user, password)
            ftp.prot_p()
            ftp.set_pasv(True)
            print(" Conectado com sucesso com criptografia TLS (FTPS)!")
            return ftp
        except Exception as err:
            print(f"FTPS TLS não disponível ({err}), tentando modo passivo padrão...")
            try:
                ftp = ftplib.FTP(timeout=45)
                ftp.connect(server, 21)
                ftp.login(user, password)
                ftp.set_pasv(True)
                print(" Conectado com sucesso em modo passivo!")
                return ftp
            except Exception as e2:
                if tentativa < max_retries:
                    espera = tentativa * 4
                    print(f"Aguardando {espera}s antes de tentar novamente...")
                    time.sleep(espera)
                else:
                    raise e2

def main():
    server = os.environ.get("FTP_SERVER")
    user = os.environ.get("FTP_USER")
    password = os.environ.get("FTP_PASS")

    if not server or not user or not password:
        print("Erro: FTP_SERVER, FTP_USER ou FTP_PASS não configurados.")
        sys.exit(1)

    ftp = conectar_ftp(server, user, password)
    print(f"Diretório inicial: {ftp.pwd()}")
    print("\n--- Estrutura do servidor FTP ---")
    try:
        ftp.dir()
    except Exception:
        pass
    print("---------------------------------\n")

    # Identificar diretórios alvos
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

    # Usar o primeiro diretório válido (ou todos se não for duplicado)
    for target in target_dirs:
        print(f"\n==========================================")
        print(f"Publicando em: {target}")
        print(f"==========================================")
        try:
            ftp.cwd("/")
        except Exception:
            pass
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
                upload_file_with_retry(ftp, local_path, item)

    print("\n Deploy concluído com 100% de sucesso!")
    try:
        ftp.quit()
    except Exception:
        pass

if __name__ == "__main__":
    main()
