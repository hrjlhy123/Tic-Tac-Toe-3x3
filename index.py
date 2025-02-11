from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from easyAI.AI import Negamax
from easyAI.TwoPlayerGame import TwoPlayerGame
from easyAI.Player import AI_Player
import eventlet
import time
import threading
import random

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")

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


def parity(numbers):  # odd or even
    return 1 if len(numbers) % 2 == 1 else 0


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


def log(numbers):
    with open("tictactoe.txt", "w") as file:
        for index, num in enumerate(numbers):
            if index % 2 == 0:
                file.write(f"O: {num}\n")
            else:
                file.write(f"X: {num}\n")

gameMode = 1
picked_numbers = []

def ai_best_move():
    """计算 AI 最佳走法"""
    available_moves = [i for i in range(1, 10) if i not in picked_numbers]
    if not available_moves:
        return None  # 没有可选的走法

    # AI 使用 Negamax 计算最佳走法
    class TicTacToeAI(TwoPlayerGame):
        def __init__(self, players):
            self.players = players
            self.moves = picked_numbers[:]  # 复制当前局势
            self.current_player = 2  # AI 是 X（第二个玩家）
            self.ai_move = None  # 用于存储 Negamax 计算的最佳落子

        def possible_moves(self):
            return [str(i) for i in range(1, 10) if i not in self.moves]  # 直接计算可选步

        def make_move(self, move):
            self.moves.append(int(move))

        def unmake_move(self, move):
            self.moves.remove(int(move))

        def is_over(self):
            # return check_win(self.moves) or len(self.moves) == 9
            return self.winner() is not None or len(self.moves) == 9

        def winner(self):
            o_moves = {self.moves[i] for i in range(0, len(self.moves), 2)}  # O 的落子
            x_moves = {self.moves[i] for i in range(1, len(self.moves), 2)}  # X 的落子
            for win in [
                {1, 2, 3},
                {4, 5, 6},
                {7, 8, 9},
                {1, 4, 7},
                {2, 5, 8},
                {3, 6, 9},
                {1, 5, 9},
                {3, 5, 7},
            ]:
                if win.issubset(o_moves):
                    return 1  # O 赢
                if win.issubset(x_moves):
                    return 2  # X 赢
            return None

        def scoring(self):
            return 100 if self.winner() == 2 else -100 if self.winner() == 1 else 0

    ai_algo = Negamax(3)  # AI 计算深度
    game = TicTacToeAI([AI_Player(ai_algo), AI_Player(ai_algo)])

    best_move = game.player.ask_move(game)
    return int(best_move) if best_move else None


# @app.route("/info", methods=["POST"])
# def receive():
#     global picked_numbers

#     data = request.get_json()

#     number = data.get("number")

#     if number != 0:
#         if number not in picked_numbers:
#             picked_numbers.append(number)
#             if len(picked_numbers) >= 5:
#                 numbers = []
#                 for index, num in enumerate(picked_numbers):
#                     if index % 2 != len(picked_numbers) % 2:
#                         numbers.append(num)
#                 if_win = check_win(numbers)
#                 if if_win or len(picked_numbers) == 9:
#                     result = {"number": number, "parity": parity(picked_numbers), "win": if_win}
#                     return jsonify(result)


#             print("picked_numbers:", picked_numbers)
#             result = {"number": number, "parity": parity(picked_numbers)}
#             # print(f"✅ 接收到前端点击的编号: {number}")
#             return jsonify(result)
#     elif number == 0:
#         picked_numbers = []
#         print("picked_numbers:", picked_numbers)
#         result = {"number": number, "parity": parity(picked_numbers)}
#         print(f"重置游戏")
#         return jsonify(result)
#     return jsonify({"status": "error", "message": "Invalid data"}), 400


@socketio.on("info")
def info(data):
    global gameMode
    global picked_numbers

    # data = request.get_json()

    if len(picked_numbers) == 0 and "gameMode" in data:
        gameMode = int(data["gameMode"])

    print("len(picked_numbers) == 0:", len(picked_numbers) == 0)
    print('"gameMode" in data:', "gameMode" in data)
    print("gameMode:", gameMode)
    number = data.get("number")

    if number != 0:
        if number not in picked_numbers:
            picked_numbers.append(number)
            print("picked_numbers:", picked_numbers)
            if len(picked_numbers) >= 5:
                numbers = []
                for index, num in enumerate(picked_numbers):
                    if index % 2 != len(picked_numbers) % 2:
                        numbers.append(num)
                if_win = check_win(numbers)
                if if_win or len(picked_numbers) == 9:
                    result = {
                        "number": number,
                        "parity": parity(picked_numbers),
                        "win": if_win,
                    }
                    emit("update", result, broadcast=True)
                else:
                    result = {"number": number, "parity": parity(picked_numbers)}
                    emit("update", result, broadcast=True)
            else:
                result = {"number": number, "parity": parity(picked_numbers)}
                emit("update", result, broadcast=True)

            # 轮到 AI
            if gameMode == 1:
                if parity(picked_numbers) == 1:  # AI (X) 走
                    ai_move = ai_best_move()
                    if ai_move:
                        picked_numbers.append(ai_move)
                        print("AI 选择:", ai_move)
                        if check_win([picked_numbers[i] for i in range(len(picked_numbers)) if i % 2 == 1]):
                            emit("update", {"number": ai_move, "parity": parity(picked_numbers), "win": True}, broadcast=True)
                        else:
                            emit("update", {"number": ai_move, "parity": parity(picked_numbers)}, broadcast=True)

            log(picked_numbers)
    # elif number == 0:
    #     picked_numbers = []
    #     print("picked_numbers:", picked_numbers)
    #     result = {"number": number, "parity": parity(picked_numbers)}
    #     print(f"重置游戏")
    #     emit("update", result, broadcast=True)


@socketio.on("disconnect")
def handle_disconnect():
    global gameMode
    global picked_numbers
    gameMode = 1
    picked_numbers = []
    log(picked_numbers)
    print("🚨 客户端断开连接，自动重置游戏")


# if __name__ == "__main__":
#     app.run(host="localhost", port=5000)

# if __name__ == "__main__":
#     socketio.run(app, host="localhost", port=5000, debug=True)

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
