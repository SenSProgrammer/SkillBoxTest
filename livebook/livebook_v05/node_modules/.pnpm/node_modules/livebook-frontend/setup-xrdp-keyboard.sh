#!/bin/bash

echo "Настройка переключения раскладки клавиатуры для XRDP..."

# 1. Создаём или редактируем скрипт запуска оконного менеджера
STARTWM="/etc/xrdp/startwm.sh"

if [ ! -f "$STARTWM" ]; then
  echo "Файл $STARTWM не найден. Создаём..."
  sudo touch "$STARTWM"
fi

# 2. Добавляем команды для переключения раскладки в startwm.sh
sudo bash -c "cat > $STARTWM << 'EOF'
#!/bin/sh

# Устанавливаем русскую и английскую раскладки
setxkbmap -layout us,ru -option grp:alt_shift_toggle

# Альтернатива: Ctrl+Shift (замените строку выше на):
# setxkbmap -layout us,ru -option grp:ctrl_shift_toggle


# Запускаем оконный менеджер (автоопределение)
if [ -n \"$XDG_CURRENT_DESKTOP\" ]; then
  case \"$XDG_CURRENT_DESKTOP\" in
    GNOME)
      exec gnome-session
      ;;
    XFCE)
      exec startxfce4
      ;;
    *)
      exec xfce4-session || exec gnome-session || exec startkde
      ;;
  esac
else
  exec xfce4-session || exec gnome-session || exec startkde
fi
EOF"

# 3. Даём права на исполнение
sudo chmod +x "$STARTWM"

# 4. Проверяем, что setxkbmap установлен
if ! command -v setxkbmap &> /dev/null; then
  echo "Устанавливаем setxkbmap..."
  sudo apt update
  sudo apt install -y xkb-data
fi

# 5. Добавляем в автозагрузку XRDP (если нужно)
# В некоторых дистрибутивах требуется дополнительно прописать в ~/.xsession
XSESSION="$HOME/.xsession"
if [ ! -f "$XSESSION" ]; then
  echo "Создаём $XSESSION для автозагрузки раскладки..."
  cat > "$XSESSION" << 'EOF'
#!/bin/sh
setxkbmap -layout us,ru -option grp:alt_shift_toggle
EOF
  chmod +x "$XSESSION"
fi

# 6. Перезапускаем XRDP
echo "Перезапуск XRDP..."
sudo systemctl restart xrdp-sesman
sudo systemctl restart xrdp


# 7. Проверка
echo ""
echo "Готово! Настройки применены."
echo "Проверьте переключение раскладки в сессии XRDP (Alt+Shift)."
echo "Если не работает — попробуйте Ctrl+Shift (измените grp:alt_shift_toggle на grp:ctrl_shift_toggle в скрипте)."
