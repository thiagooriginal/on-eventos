#!/usr/bin/env python3
"""
ON Agência de Eventos - Validador de Conexão Segura FTPS (Hostinger)

Testa a autenticação e a integridade do transporte criptografado TLS (FTPS)
sem realizar uploads, alterações ou exclusões de arquivos no servidor.

Uso:
  python security/test-ftps-connection.py
    (utiliza as variáveis de ambiente FTP_SERVER, FTP_USER, FTP_PASS)

  python security/test-ftps-connection.py --server=ftp.onagenciadeeventos.com.br --user=uXXXXX --pass=SuaNovaSenha
"""

import sys
import os
import ftplib
import argparse

def test_ftps(server, user, password, port=21):
    print("============================================================")
    print("  TESTE DE CONECTIVIDADE E AUTENTICAÇÃO FTPS (HOSTINGER)")
    print("============================================================\n")
    print(f"- Servidor alvo:   {server}:{port}")
    print(f"- Usuário FTP:     {user}")
    print(f"- Criptografia:    Obrigatória (FTP_TLS explícito / prot_p)")
    print("- Modo de teste:   Leitura estrita (Nenhum arquivo será alterado)\n")

    try:
        print("[1/4] Estabelecendo canal de controle com TLS explícito...")
        ftp = ftplib.FTP_TLS(timeout=30)
        ftp.connect(server, port)
        print("  ✓ Handshake TLS inicial bem-sucedido.")

        print(f"[2/4] Autenticando usuário '{user}'...")
        ftp.login(user, password)
        print("  ✓ Autenticação de credenciais aceita pelo servidor.")

        print("[3/4] Ativando proteção criptográfica total no canal de dados (PROT P)...")
        ftp.prot_p()
        ftp.set_pasv(True)
        print("  ✓ Canal de transferência de dados 100% criptografado.")

        print("[4/4] Verificando permissões de diretório no servidor...")
        pwd = ftp.pwd()
        print(f"  ✓ Diretório inicial confirmado: {pwd}")

        # Verifica se o diretório do site está presente
        dirs_found = []
        for target in ["/public_html", "public_html", "/domains/onagenciadeeventos.com.br/public_html"]:
            try:
                ftp.cwd(target)
                dirs_found.append(target)
                ftp.cwd(pwd)
            except Exception:
                pass

        if dirs_found:
            print(f"  ✓ Raiz pública localizada no servidor: {', '.join(dirs_found)}")
        else:
            print(f"  ! Aviso: public_html não localizado na raiz padrão. Diretório atual: {pwd}")

        ftp.quit()
        print("\n------------------------------------------------------------")
        print("[SUCESSO] Conexão FTPS e credenciais validadas com 100% de êxito!")
        print("A nova senha é válida e pode ser atualizada nos Secrets do GitHub.")
        print("------------------------------------------------------------\n")
        return True

    except ftplib.error_perm as perm_err:
        print(f"\n[ERRO DE AUTENTICAÇÃO]: O servidor rejeitou as credenciais informadas.")
        print(f"Detalhes: {perm_err}")
        print("Verifique se o usuário e a senha foram digitados corretamente no hPanel.")
        return False
    except Exception as err:
        print(f"\n[FALHA DE CONEXÃO FTPS]: Não foi possível completar o teste seguro.")
        print(f"Detalhes: {err}")
        print("Certifique-se de que o host e a porta 21 estão acessíveis sem bloqueio de firewall.")
        return False

def main():
    parser = argparse.ArgumentParser(description="Validador FTPS Hostinger")
    parser.add_argument("--server", help="Servidor FTP (ex: ftp.onagenciadeeventos.com.br)")
    parser.add_argument("--user", help="Usuário FTP")
    parser.add_argument("--pass", dest="password", help="Senha do usuário FTP")
    parser.add_argument("--port", type=int, default=21, help="Porta FTP (padrão: 21)")

    args = parser.parse_args()

    server = args.server or os.environ.get("FTP_SERVER")
    user = args.user or os.environ.get("FTP_USER") or os.environ.get("FTP_USERNAME")
    password = args.password or os.environ.get("FTP_PASS") or os.environ.get("FTP_PASSWORD")

    if not server or not user or not password:
        print("Uso:")
        print("  python security/test-ftps-connection.py --server=<host> --user=<usuario> --pass=<senha>")
        print("Ou defina as variáveis de ambiente FTP_SERVER, FTP_USER e FTP_PASS.")
        sys.exit(1)

    ok = test_ftps(server, user, password, args.port)
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
