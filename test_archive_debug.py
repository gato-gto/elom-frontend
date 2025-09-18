#!/usr/bin/env python3
"""
Тест архивирования для отладки проблемы
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://127.0.0.1:8000/api/v1"

def get_auth_token():
    """Получить токен аутентификации"""
    response = requests.post(f"{BASE_URL}/auth/token/", json={
        "username": "admin",
        "password": "password123"
    })
    if response.status_code == 200:
        return response.json()["access"]
    else:
        print(f"Ошибка аутентификации: {response.status_code}")
        return None

def test_archive_close():
    """Тестирование закрытия периода"""
    token = get_auth_token()
    if not token:
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("🧪 Тестирование архивирования...")
    
    # Сначала получим список объектов
    response = requests.get(f"{BASE_URL}/objects/", headers=headers)
    if response.status_code != 200:
        print(f"❌ Ошибка получения объектов: {response.status_code}")
        return False
    
    objects = response.json()["results"]
    if not objects:
        print("❌ Нет объектов для тестирования")
        return False
    
    obj_id = objects[0]["id"]
    print(f"📋 Тестируем с объектом ID: {obj_id}")
    
    # Тестируем закрытие периода
    test_data = {
        "object": obj_id,
        "month": "2025-10"
    }
    
    print(f"🔒 Закрываем период {test_data['month']} для объекта {obj_id}...")
    
    response = requests.post(
        f"{BASE_URL}/archive/periods/close/",
        headers=headers,
        json=test_data
    )
    
    print(f"📊 Статус ответа: {response.status_code}")
    print(f"📄 Ответ: {response.text[:500]}")
    
    if response.status_code == 201:
        print("✅ Период успешно закрыт!")
        return True
    else:
        print("❌ Ошибка при закрытии периода")
        return False

def test_archive_list():
    """Тестирование списка архивных периодов"""
    token = get_auth_token()
    if not token:
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n📋 Получаем список архивных периодов...")
    
    response = requests.get(f"{BASE_URL}/archive/periods/", headers=headers)
    print(f"📊 Статус: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Найдено {len(data['results'])} архивных периодов")
        for period in data["results"]:
            print(f"  - {period['month']} | Объект: {period['object_name']} | Закрыт: {period['closed_at']}")
    else:
        print(f"❌ Ошибка: {response.text[:200]}")
    
    return response.status_code == 200

def main():
    """Основная функция тестирования"""
    print("🚀 Тестирование архивирования")
    print("=" * 50)
    
    # Тест списка периодов
    list_ok = test_archive_list()
    
    # Тест закрытия периода
    close_ok = test_archive_close()
    
    # Повторный тест списка
    if close_ok:
        test_archive_list()
    
    print("\n" + "=" * 50)
    print("📋 Результаты:")
    print(f"  Список периодов: {'✅' if list_ok else '❌'}")
    print(f"  Закрытие периода: {'✅' if close_ok else '❌'}")
    
    return list_ok and close_ok

if __name__ == "__main__":
    main()
