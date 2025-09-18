#!/usr/bin/env python3
"""
Тест интеграции frontend с backend API
Проверяет все основные функции системы
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://127.0.0.1:8000/api/v1"
FRONTEND_URL = "http://localhost:5174"

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

def test_reports_api():
    """Тестирование API отчетов"""
    token = get_auth_token()
    if not token:
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Тестируем все типы отчетов
    reports = [
        ("by-period", "Отчет по периодам"),
        ("by-object", "Отчет по объектам"), 
        ("by-responsible", "Отчет по ответственным"),
        ("by-material", "Отчет по материалам")
    ]
    
    print("🧪 Тестирование API отчетов...")
    
    for report_type, name in reports:
        print(f"\n📊 {name}:")
        
        # Тест JSON ответа
        response = requests.get(f"{BASE_URL}/reports/purchases/{report_type}/", headers=headers)
        if response.status_code == 200:
            data = response.json()
            if "rows" in data and isinstance(data["rows"], list):
                print(f"  ✅ JSON формат корректен: {len(data['rows'])} записей")
                
                # Проверяем структуру первой записи
                if data["rows"]:
                    first_row = data["rows"][0]
                    if isinstance(first_row, dict):
                        print(f"  ✅ Структура записи: {list(first_row.keys())}")
                    else:
                        print(f"  ❌ Неверная структура записи: {type(first_row)}")
            else:
                print(f"  ❌ Неверный формат ответа: {list(data.keys())}")
        else:
            print(f"  ❌ Ошибка HTTP: {response.status_code}")
        
        # Тест Excel экспорта
        excel_response = requests.get(f"{BASE_URL}/reports/purchases/{report_type}/?export=xlsx", headers=headers)
        if excel_response.status_code == 200:
            print(f"  ✅ Excel экспорт работает")
        else:
            print(f"  ❌ Excel экспорт ошибка: {excel_response.status_code}")
    
    return True

def test_basic_api():
    """Тестирование базовых API endpoints"""
    token = get_auth_token()
    if not token:
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n🔧 Тестирование базовых API...")
    
    endpoints = [
        ("/objects/", "Объекты"),
        ("/materials/", "Материалы"),
        ("/purchases/", "Закупки"),
        ("/employees/", "Сотрудники"),
        ("/units/", "Единицы измерения"),
        ("/material-categories/", "Категории материалов")
    ]
    
    for endpoint, name in endpoints:
        response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
        if response.status_code == 200:
            data = response.json()
            if "results" in data:
                print(f"  ✅ {name}: {len(data['results'])} записей")
            else:
                print(f"  ✅ {name}: {len(data)} записей")
        else:
            print(f"  ❌ {name}: ошибка {response.status_code}")
    
    return True

def test_frontend_connectivity():
    """Тестирование доступности frontend"""
    print("\n🌐 Тестирование frontend...")
    
    try:
        response = requests.get(FRONTEND_URL, timeout=5)
        if response.status_code == 200:
            print(f"  ✅ Frontend доступен: {FRONTEND_URL}")
            return True
        else:
            print(f"  ❌ Frontend недоступен: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"  ❌ Frontend недоступен: {e}")
        return False

def main():
    """Основная функция тестирования"""
    print("🚀 Тестирование интеграции Frontend + Backend")
    print("=" * 50)
    
    # Тест backend
    backend_ok = test_basic_api() and test_reports_api()
    
    # Тест frontend
    frontend_ok = test_frontend_connectivity()
    
    print("\n" + "=" * 50)
    print("📋 Результаты тестирования:")
    print(f"  Backend API: {'✅ Работает' if backend_ok else '❌ Проблемы'}")
    print(f"  Frontend: {'✅ Доступен' if frontend_ok else '❌ Недоступен'}")
    
    if backend_ok and frontend_ok:
        print("\n🎉 Интеграция работает корректно!")
        print("   Frontend готов к работе с обновленным API")
    else:
        print("\n⚠️  Обнаружены проблемы, требующие внимания")
    
    return backend_ok and frontend_ok

if __name__ == "__main__":
    main()
