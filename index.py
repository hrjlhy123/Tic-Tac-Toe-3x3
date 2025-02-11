from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import threading
import random

app = Flask(__name__)
CORS(app)

# class RandomNumberPicker:
#     def __init__(self):
#         self.numbers = list(range(1, 10))
#         self.picked_numbers = []

#     def draw(self):
#         if not self.numbers:
#             return None
#         number = self.numbers.pop(random.randint(0, len(self.numbers) - 1))
#         self.picked_numbers.append(number)
#         return number

#     def parity(self): # odd or even
#         return 1 if len(self.picked_numbers) % 2 == 1 else 2

# picker = RandomNumberPicker()
# trigger_state = ""  # 触发状态

# @app.route("/trigger", methods=["GET", "POST"])
# def trigger():
#     global trigger_state
#     if request.method == "POST":
#         trigger_state = request.data.decode("utf-8")
#         return "✅ Trigger Updated"

#     # 获取后清除触发状态，避免重复触发
#     temp = trigger_state
#     trigger_state = ""  # **重要：清空状态**

#     return jsonify({
#         "number": temp,
#         "parity": picker.parity()
#     })

# def auto_trigger():
#     """ 每 5 秒触发一次 toggle3 """
#     global trigger_state
#     while True:
#         time.sleep(5)
#         number = picker.draw()
#         if number:
#             trigger_state = "toggle" + str(number)
#             print("🔵 自动触发: toggle" + str(number))
#         else:
#             print("没有数字")
#             break

# # 在后台运行自动触发线程
# threading.Thread(target=auto_trigger, daemon=True).start()


def parity(number):  # odd or even
    return 1 if len(number) % 2 == 1 else 0


def check_win(numbers):
    print("numbers:", numbers)
    if_win = False
    numbers_win = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [1, 4, 7],
        [2, 5, 8],
        [3, 6, 9],
        [1, 5, 9],
        [3, 5, 7],
    ]

    for number_win in numbers_win:
        if set(number_win).issubset(set(numbers)):
            if_win = True
            break
    print("if_win:", if_win)
    return if_win 

picked_numbers = []


@app.route("/info", methods=["POST"])
def receive():
    global picked_numbers

    data = request.get_json()

    number = data.get("number")

    if number != 0:
        if number not in picked_numbers:
            picked_numbers.append(number)
            if len(picked_numbers) >= 5:
                numbers = []
                for index, num in enumerate(picked_numbers):
                    if index % 2 != len(picked_numbers) % 2:
                        numbers.append(num)
                if_win = check_win(numbers)
                if if_win or len(picked_numbers) == 9:
                    result = {"number": number, "parity": parity(picked_numbers), "win": if_win}
                    return jsonify(result)


            print("picked_numbers:", picked_numbers)
            result = {"number": number, "parity": parity(picked_numbers)}
            # print(f"✅ 接收到前端点击的编号: {number}")
            return jsonify(result)
    elif number == 0:
        picked_numbers = []
        print("picked_numbers:", picked_numbers)
        result = {"number": number, "parity": parity(picked_numbers)}
        print(f"重置游戏")
        return jsonify(result)
    return jsonify({"status": "error", "message": "Invalid data"}), 400


if __name__ == "__main__":
    app.run(host="localhost", port=5000)
